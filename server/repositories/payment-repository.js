import { Payment } from "../models/payment.js";
import { buildSort } from "../validators/admin/common.js";

const INVOICE_POPULATE = {
  path: "invoiceId",
  select: "invoiceNumber status totalMinor amountPaidMinor amountRefundedMinor currency clientId",
};

const CLIENT_POPULATE = {
  path: "clientId",
  select: "displayName companyName primaryEmail",
};

export async function listPayments({
  page,
  limit,
  status,
  provider,
  invoiceId,
  clientId,
  sort,
  order,
}) {
  const filter = {};
  if (status) filter.status = status;
  if (provider) filter.provider = provider;
  if (invoiceId) filter.invoiceId = invoiceId;
  if (clientId) filter.clientId = clientId;

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .sort(buildSort(sort, order, "createdAt"))
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(INVOICE_POPULATE)
      .populate(CLIENT_POPULATE)
      .lean(),
    Payment.countDocuments(filter),
  ]);

  return { items, total };
}

export async function findPaymentById(id) {
  return Payment.findById(id)
    .populate(INVOICE_POPULATE)
    .populate(CLIENT_POPULATE)
    .lean();
}

export async function findPaymentRawById(id, session = null) {
  const query = Payment.findById(id);
  if (session) query.session(session);
  return query.lean();
}

export async function findPaymentDocumentById(id, session = null) {
  const query = Payment.findById(id);
  if (session) query.session(session);
  return query;
}

export async function findPaymentForClient({ id, clientId, invoiceId }) {
  const filter = { _id: id, clientId };
  if (invoiceId) filter.invoiceId = invoiceId;
  return Payment.findOne(filter).lean();
}

export async function findByIdempotencyKey(key) {
  if (!key) return null;
  return Payment.findOne({ idempotencyKey: key }).lean();
}

export async function createPayment(data) {
  return Payment.create(data);
}

export async function markSucceeded({
  id,
  providerPaymentId,
  providerMethod,
  session = null,
}) {
  const query = Payment.findOneAndUpdate(
    {
      _id: id,
      status: { $in: ["INITIATED", "PENDING"] },
    },
    {
      $set: {
        status: "SUCCEEDED",
        verifiedAt: new Date(),
        ...(providerPaymentId ? { providerPaymentId } : {}),
        ...(providerMethod ? { providerMethod } : {}),
        safeFailureCode: undefined,
      },
    },
    { new: true, session },
  );
  return query.lean();
}

export async function markAttemptTerminal({
  id,
  status,
  safeFailureCode,
  session = null,
}) {
  const query = Payment.findOneAndUpdate(
    {
      _id: id,
      status: { $in: ["INITIATED", "PENDING"] },
    },
    {
      $set: {
        status,
        failedAt: new Date(),
        ...(safeFailureCode ? { safeFailureCode } : {}),
      },
    },
    { new: true, session },
  );
  return query.lean();
}

export async function updatePayment({ id, changes, session = null }) {
  const payment = await findPaymentDocumentById(id, session);
  if (!payment) return null;
  for (const [key, value] of Object.entries(changes)) {
    payment[key] = value === null ? undefined : value;
  }
  await payment.save({ session });
  return payment.toObject();
}

export async function savePayment(payment, session = null) {
  await payment.save({ session });
  return payment;
}

export async function applyRefundToPayment({
  id,
  amountMinor,
  session = null,
}) {
  // Conditional update: never let concurrent refund requests push the total
  // above the captured amount. A `null` result is treated as a conflict by the
  // service, which rolls back the surrounding transaction.
  const now = new Date();
  const query = Payment.findOneAndUpdate(
    {
      _id: id,
      $expr: {
        $lte: [
          { $add: ["$refundedAmountMinor", amountMinor] },
          "$amountMinor",
        ],
      },
    },
    [
      {
        $set: {
          refundedAmountMinor: {
            $add: ["$refundedAmountMinor", amountMinor],
          },
          status: {
            $cond: [
              {
                $gte: [
                  { $add: ["$refundedAmountMinor", amountMinor] },
                  "$amountMinor",
                ],
              },
              "REFUNDED",
              "PARTIALLY_REFUNDED",
            ],
          },
          updatedAt: now,
        },
      },
    ],
    { new: true, session },
  );
  return query.lean();
}

export const paymentRepository = Object.freeze({
  list: listPayments,
  findById: findPaymentById,
  findRawById: findPaymentRawById,
  findDocumentById: findPaymentDocumentById,
  findForClient: findPaymentForClient,
  findByIdempotencyKey,
  create: createPayment,
  markSucceeded,
  markAttemptTerminal,
  update: updatePayment,
  save: savePayment,
  applyRefund: applyRefundToPayment,
});

export default paymentRepository;
