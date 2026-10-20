import mongoose from "mongoose";
import { Invoice } from "../models/invoice.js";
import { buildSort } from "../validators/admin/common.js";
import { containsFilter } from "../utils/mongo-search.js";

const CLIENT_POPULATE = {
  path: "clientId",
  select: "displayName companyName primaryEmail phone status",
};

const PROJECT_POPULATE = {
  path: "projectId",
  select: "name status clientId",
};

function dateBounds(from, to) {
  const filter = {};
  if (from) filter.$gte = new Date(`${from}T00:00:00.000Z`);
  if (to) filter.$lte = new Date(`${to}T23:59:59.999Z`);
  return Object.keys(filter).length > 0 ? filter : null;
}

function cutoffDate(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function applyStatusFilter(filter, and, { status, overdueBefore, overdueCutoff }) {
  if (status === "OVERDUE") {
    filter.status = { $in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] };
    if (overdueBefore) filter.dueDate = { $lt: cutoffDate(overdueBefore) };
    return;
  }

  if (status) filter.status = status;

  // `ISSUED` and `PARTIALLY_PAID` are derived at read time too. Exclude
  // invoices whose due date has already passed so this filter matches what the
  // API displays as `OVERDUE`.
  if (
    (status === "ISSUED" || status === "PARTIALLY_PAID") &&
    overdueCutoff
  ) {
    and.push({
      $or: [
        { dueDate: { $exists: false } },
        { dueDate: { $gte: cutoffDate(overdueCutoff) } },
      ],
    });
  }
}

function buildFilter({
  status,
  clientId,
  projectId,
  search,
  from,
  to,
  overdueBefore,
  overdueCutoff,
}) {
  const filter = {};
  const and = [];

  applyStatusFilter(filter, and, { status, overdueBefore, overdueCutoff });
  if (clientId) filter.clientId = clientId;
  if (projectId) filter.projectId = projectId;

  const created = dateBounds(from, to);
  if (created) filter.createdAt = created;

  if (search) {
    and.push({
      $or: [
        { invoiceNumber: containsFilter(search) },
        { notes: containsFilter(search) },
        { internalNotes: containsFilter(search) },
      ],
    });
  }

  if (and.length > 0) filter.$and = and;
  return filter;
}

export async function listInvoices({
  page,
  limit,
  status,
  clientId,
  projectId,
  search,
  from,
  to,
  sort,
  order,
  overdueBefore,
  overdueCutoff,
}) {
  const filter = buildFilter({
    status,
    clientId,
    projectId,
    search,
    from,
    to,
    overdueBefore,
    overdueCutoff,
  });
  const sortSpec = buildSort(sort, order, "createdAt");

  const [items, total] = await Promise.all([
    Invoice.find(filter)
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(CLIENT_POPULATE)
      .populate(PROJECT_POPULATE)
      .lean(),
    Invoice.countDocuments(filter),
  ]);

  return { items, total };
}

export async function listInvoicesForClient({
  clientId,
  page,
  limit,
  status,
  overdueBefore,
  overdueCutoff,
}) {
  if (status === "DRAFT") return { items: [], total: 0 };

  const filter = { clientId };
  const and = [];

  if (status) {
    applyStatusFilter(filter, and, { status, overdueBefore, overdueCutoff });
  } else {
    filter.status = { $ne: "DRAFT" };
  }

  if (and.length > 0) filter.$and = and;

  const [items, total] = await Promise.all([
    Invoice.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(PROJECT_POPULATE)
      .lean(),
    Invoice.countDocuments(filter),
  ]);

  return { items, total };
}

export async function findInvoiceById(id) {
  return Invoice.findById(id)
    .populate(CLIENT_POPULATE)
    .populate(PROJECT_POPULATE)
    .lean();
}

export async function findInvoiceRawById(id, session = null) {
  const query = Invoice.findById(id);
  if (session) query.session(session);
  return query.lean();
}

export async function findInvoiceDocumentById(id, session = null) {
  const query = Invoice.findById(id);
  if (session) query.session(session);
  return query;
}

export async function findInvoiceForClient({ id, clientId, session = null }) {
  const query = Invoice.findOne({ _id: id, clientId, status: { $ne: "DRAFT" } });
  if (session) query.session(session);
  return query.lean();
}

/**
 * Portal detail view: ownership-scoped, with the client and project names the
 * invoice document needs. Internal notes remain in the document but are removed
 * by `serializePortalInvoiceDetail`; serializers are still the only response
 * boundary.
 */
export async function findInvoiceForClientDetail({ id, clientId, session = null }) {
  const query = Invoice.findOne({ _id: id, clientId, status: { $ne: "DRAFT" } })
    .populate(CLIENT_POPULATE)
    .populate(PROJECT_POPULATE);
  if (session) query.session(session);
  return query.lean();
}

export async function createInvoice(data) {
  const invoice = await Invoice.create(data);
  return findInvoiceById(invoice._id);
}

export async function updateInvoice({ id, changes, session = null }) {
  const invoice = await findInvoiceDocumentById(id, session);
  if (!invoice) return null;

  for (const [key, value] of Object.entries(changes)) {
    invoice[key] = value === null ? undefined : value;
  }

  await invoice.save({ session });
  return findInvoiceById(id);
}

export async function saveInvoice(invoice, session = null) {
  await invoice.save({ session });
  return invoice;
}

/**
 * Apply a verified ledger amount atomically.
 *
 * A read-modify-save sequence can lose one of two concurrent payments when
 * MongoDB transactions are disabled. The pipeline increments the stored totals
 * in a single atomic write and recomputes the balance from the fresh values.
 * Status is derived again by the serializer on read, so a rare concurrent
 * status race cannot change the displayed state.
 */
function applyLedgerChange({ invoiceId, paidMinor, refundedMinor, status, session }) {
  const pipeline = [
    {
      $set: {
        amountPaidMinor: {
          $add: [{ $ifNull: ["$amountPaidMinor", 0] }, paidMinor],
        },
        amountRefundedMinor: {
          $add: [{ $ifNull: ["$amountRefundedMinor", 0] }, refundedMinor],
        },
      },
    },
    {
      $set: {
        balanceDueMinor: {
          $max: [
            0,
            {
              $subtract: [
                "$totalMinor",
                { $subtract: ["$amountPaidMinor", "$amountRefundedMinor"] },
              ],
            },
          ],
        },
        overpaidMinor: {
          $max: [
            0,
            {
              $subtract: [
                { $subtract: ["$amountPaidMinor", "$amountRefundedMinor"] },
                "$totalMinor",
              ],
            },
          ],
        },
        ...(status ? { status } : {}),
        updatedAt: new Date(),
      },
    },
  ];

  const query = Invoice.findOneAndUpdate({ _id: invoiceId }, pipeline, {
    new: true,
    session,
  });
  return query.lean();
}

/**
 * Apply a verified payment atomically, so two provider events cannot read the
 * same invoice balance and overwrite each other outside a transaction.
 */
export async function applyVerifiedPayment({
  invoiceId,
  amountMinor,
  status,
  session = null,
}) {
  return applyLedgerChange({
    invoiceId,
    paidMinor: amountMinor,
    refundedMinor: 0,
    status,
    session,
  });
}

/** Apply a verified refund atomically for the same reason as a payment. */
export async function applyVerifiedRefund({
  invoiceId,
  amountMinor,
  status,
  session = null,
}) {
  return applyLedgerChange({
    invoiceId,
    paidMinor: 0,
    refundedMinor: amountMinor,
    status,
    session,
  });
}

export const invoiceRepository = Object.freeze({
  list: listInvoices,
  listForClient: listInvoicesForClient,
  findById: findInvoiceById,
  findRawById: findInvoiceRawById,
  findDocumentById: findInvoiceDocumentById,
  findForClient: findInvoiceForClient,
  findForClientDetail: findInvoiceForClientDetail,
  create: createInvoice,
  update: updateInvoice,
  save: saveInvoice,
  applyVerifiedPayment,
  applyVerifiedRefund,
});

export default invoiceRepository;

export function isInvoiceObjectId(value) {
  return mongoose.isValidObjectId(value);
}
