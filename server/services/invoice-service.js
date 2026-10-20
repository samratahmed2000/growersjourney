import {
  INITIAL_INVOICE_STATUS,
  INVOICE_LIMITS,
} from "../constants/invoice.js";
import { isDuplicateKeyError } from "../utils/mongo-errors.js";
import {
  balanceDueMinor,
  calculateInvoiceTotals,
  normalizeCurrency,
  overpaidMinor,
} from "../utils/money.js";
import { dueDateOverdueCutoff, todayInTimeZone } from "../utils/invoice-status.js";
import {
  serializeInvoiceDetail,
  serializeInvoiceSummary,
  serializePortalInvoiceDetail,
} from "../utils/serializers.js";
import {
  badRequest,
  HttpError,
  notFoundError,
} from "../utils/http-error.js";

const DEFAULT_CONFIG = Object.freeze({
  supportedCurrencies: ["BDT"],
  taxEnabled: false,
  discountEnabled: false,
  timezone: "Asia/Dhaka",
  overdueGraceDays: 0,
  invoiceNumberPrefix: "INV",
  paymentsEnabled: false,
});

function normalizedConfig(config = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    supportedCurrencies: (
      config.supportedCurrencies ?? DEFAULT_CONFIG.supportedCurrencies
    ).map((currency) => String(currency).toUpperCase()),
    invoiceNumberPrefix: String(
      config.invoiceNumberPrefix ?? DEFAULT_CONFIG.invoiceNumberPrefix,
    )
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "")
      .slice(0, 12) || DEFAULT_CONFIG.invoiceNumberPrefix,
  };
}

function dateOnlyFromToday(now, timeZone) {
  return new Date(`${todayInTimeZone(now, timeZone)}T00:00:00.000Z`);
}

function listQueryWithDerivedStatus(query, config, now) {
  if (!["OVERDUE", "ISSUED", "PARTIALLY_PAID"].includes(query.status)) {
    return query;
  }

  const cutoff = dueDateOverdueCutoff({
    graceDays: config.overdueGraceDays,
    now,
    timeZone: config.timezone,
  });

  return {
    ...query,
    overdueBefore: cutoff,
    overdueCutoff: cutoff,
  };
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function prepareLineItems(items) {
  return (items ?? []).map((item) => {
    let quantityMilli = item.quantityMilli;
    if (!Number.isSafeInteger(quantityMilli) && item.quantity !== undefined) {
      quantityMilli = Math.round(Number(item.quantity) * 1000);
    }
    return {
      description: String(item.description ?? "").trim(),
      quantityMilli,
      unitAmountMinor: item.unitAmountMinor,
    };
  });
}

function invoiceTotals({ lineItems, discountMinor, taxRateBps, config }) {
  return calculateInvoiceTotals({
    items: prepareLineItems(lineItems),
    discountMinor,
    taxRateBps,
    discountEnabled: config.discountEnabled,
    taxEnabled: config.taxEnabled,
  });
}

function totalsChanges(totals) {
  return {
    lineItems: totals.lineItems,
    subtotalMinor: totals.subtotalMinor,
    discountMinor: totals.discountMinor,
    taxRateBps: totals.taxRateBps,
    taxMinor: totals.taxMinor,
    totalMinor: totals.totalMinor,
  };
}

function serializationOptions(config, { includeInternal = false } = {}) {
  return {
    includeInternal,
    paymentsEnabled: config.paymentsEnabled,
    timezone: config.timezone,
    overdueGraceDays: config.overdueGraceDays,
    now: new Date(),
  };
}

export function createInvoiceService({
  invoiceRepository,
  counterRepository,
  clientRepository,
  projectRepository,
  auditRepository,
  config: rawConfig = {},
  now = () => new Date(),
} = {}) {
  if (!invoiceRepository || !clientRepository || !projectRepository) {
    throw new Error("Invoice service dependencies are incomplete.");
  }

  const config = normalizedConfig(rawConfig);

  async function audit({ actorUserId, action, resourceId, requestId, metadata }) {
    if (!auditRepository) return;
    try {
      await auditRepository.record({
        actorUserId,
        action,
        resourceType: "INVOICE",
        resourceId: resourceId ? String(resourceId) : undefined,
        requestId,
        outcome: "SUCCESS",
        metadata,
      });
    } catch {
      // Audit is best-effort: a logging outage must not leave a committed
      // invoice change with a 500 response and no way to tell what happened.
    }
  }

  async function withInvoiceNumberConflict(callback) {
    try {
      return await callback();
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new HttpError(
          409,
          "INVOICE_NUMBER_CONFLICT",
          "That invoice number is already in use.",
        );
      }
      throw error;
    }
  }

  async function requireClient({ clientId, currentClientId, allowCurrentInactive = false }) {
    const client = await clientRepository.findById(clientId);
    if (!client) throw notFoundError("Client not found.");

    const sameClient =
      currentClientId && String(currentClientId) === String(clientId);

    if (client.status !== "ACTIVE" && !(allowCurrentInactive && sameClient)) {
      throw new HttpError(
        409,
        "CLIENT_INACTIVE",
        "An invoice cannot be assigned to an inactive client.",
      );
    }

    return client;
  }

  async function requireProject({ projectId, clientId }) {
    if (!projectId) return null;
    const project = await projectRepository.findRawById(projectId);
    if (!project) {
      throw badRequest("Please select a valid project.", [
        { field: "body.projectId", message: "Project not found." },
      ]);
    }
    if (String(project.clientId?._id ?? project.clientId) !== String(clientId)) {
      throw badRequest("The selected project does not belong to this client.", [
        { field: "body.projectId", message: "Project does not belong to the client." },
      ]);
    }
    return project;
  }

  async function generateInvoiceNumber(issueDate) {
    if (!counterRepository) {
      throw new HttpError(
        500,
        "INVOICE_NUMBERING_UNAVAILABLE",
        "Invoice numbering is not configured.",
      );
    }
    const year = new Date(issueDate).getUTCFullYear();
    const sequence = await counterRepository.next({
      prefix: config.invoiceNumberPrefix,
      year,
    });
    return `${config.invoiceNumberPrefix}-${year}-${String(sequence).padStart(6, "0")}`;
  }

  return {
    config,

    async list(query) {
      const repositoryQuery = listQueryWithDerivedStatus(query, config, now());
      const { items, total } = await invoiceRepository.list(repositoryQuery);
      return {
        items: items.map((invoice) =>
          serializeInvoiceSummary(invoice, serializationOptions(config)),
        ),
        total,
      };
    },

    async listForClient({ clientId, query }) {
      const repositoryQuery = listQueryWithDerivedStatus(query, config, now());
      const { items, total } = await invoiceRepository.listForClient({
        clientId,
        ...repositoryQuery,
      });
      return {
        items: items.map((invoice) =>
          serializeInvoiceSummary(invoice, serializationOptions(config)),
        ),
        total,
      };
    },

    async getById(id) {
      const invoice = await invoiceRepository.findById(id);
      if (!invoice) throw notFoundError("Invoice not found.");
      return serializeInvoiceDetail(
        invoice,
        serializationOptions(config, { includeInternal: true }),
      );
    },

    async getForClient({ id, clientId }) {
      const invoice = await invoiceRepository.findForClientDetail({
        id,
        clientId,
      });
      if (!invoice) throw notFoundError("Invoice not found.");
      return serializePortalInvoiceDetail(
        invoice,
        serializationOptions(config),
      );
    },

    async createDraft({ data, actorUserId, requestId }) {
      const currency = normalizeCurrency(
        data.currency,
        config.supportedCurrencies,
      );
      await requireClient({ clientId: data.clientId });
      await requireProject({ projectId: data.projectId, clientId: data.clientId });

      const totals = invoiceTotals({
        lineItems: data.lineItems,
        discountMinor: data.discountMinor ?? 0,
        taxRateBps: data.taxRateBps ?? 0,
        config,
      });

      const issueDate = data.issueDate ?? undefined;
      const dueDate = data.dueDate ?? undefined;
      if (issueDate && dueDate && dueDate < issueDate) {
        throw badRequest("The due date cannot be before the issue date.", [
          { field: "body.dueDate", message: "Due date is before the issue date." },
        ]);
      }

      const invoice = await withInvoiceNumberConflict(() =>
        invoiceRepository.create({
          clientId: data.clientId,
          projectId: data.projectId ?? undefined,
          currency,
          invoiceNumber: data.invoiceNumber ?? undefined,
          lineItems: totals.lineItems,
          subtotalMinor: totals.subtotalMinor,
          discountMinor: totals.discountMinor,
          taxRateBps: totals.taxRateBps,
          taxMinor: totals.taxMinor,
          totalMinor: totals.totalMinor,
          amountPaidMinor: 0,
          amountRefundedMinor: 0,
          balanceDueMinor: totals.totalMinor,
          overpaidMinor: 0,
          status: INITIAL_INVOICE_STATUS,
          issueDate,
          dueDate,
          notes: data.notes ?? undefined,
          internalNotes: data.internalNotes ?? undefined,
          createdBy: actorUserId,
          updatedBy: actorUserId,
        }),
      );

      await audit({
        actorUserId,
        action: "INVOICE_CREATED",
        resourceId: invoice._id,
        requestId,
        metadata: { status: invoice.status, totalMinor: invoice.totalMinor },
      });

      return serializeInvoiceDetail(
        invoice,
        serializationOptions(config, { includeInternal: true }),
      );
    },

    async updateDraft({ id, data, actorUserId, requestId }) {
      const current = await invoiceRepository.findRawById(id);
      if (!current) throw notFoundError("Invoice not found.");
      if (current.status !== "DRAFT") {
        throw new HttpError(
          409,
          "INVOICE_NOT_EDITABLE",
          "Only a draft invoice can be edited.",
        );
      }

      const clientId = data.clientId ?? String(current.clientId);
      await requireClient({
        clientId,
        currentClientId: current.clientId,
        allowCurrentInactive: true,
      });

      const projectId = hasOwn(data, "projectId")
        ? data.projectId
        : current.projectId;
      await requireProject({ projectId, clientId });

      const lineItems = hasOwn(data, "lineItems")
        ? data.lineItems
        : current.lineItems;
      const discountMinor = hasOwn(data, "discountMinor")
        ? data.discountMinor
        : current.discountMinor;
      const taxRateBps = hasOwn(data, "taxRateBps")
        ? data.taxRateBps
        : current.taxRateBps;

      const totals = invoiceTotals({
        lineItems,
        discountMinor,
        taxRateBps,
        config,
      });

      const issueDate = hasOwn(data, "issueDate")
        ? data.issueDate ?? undefined
        : current.issueDate;
      const dueDate = hasOwn(data, "dueDate")
        ? data.dueDate ?? undefined
        : current.dueDate;
      if (issueDate && dueDate && dueDate < issueDate) {
        throw badRequest("The due date cannot be before the issue date.", [
          { field: "body.dueDate", message: "Due date is before the issue date." },
        ]);
      }

      const changes = {
        ...totalsChanges(totals),
        clientId,
        projectId: projectId ?? undefined,
        currency: normalizeCurrency(
          data.currency ?? current.currency,
          config.supportedCurrencies,
        ),
        invoiceNumber:
          hasOwn(data, "invoiceNumber")
            ? data.invoiceNumber ?? undefined
            : current.invoiceNumber,
        issueDate,
        dueDate,
        notes: hasOwn(data, "notes")
          ? data.notes ?? undefined
          : current.notes,
        internalNotes: hasOwn(data, "internalNotes")
          ? data.internalNotes ?? undefined
          : current.internalNotes,
        balanceDueMinor: totals.totalMinor,
        overpaidMinor: 0,
        updatedBy: actorUserId,
      };

      const invoice = await withInvoiceNumberConflict(() =>
        invoiceRepository.update({ id, changes }),
      );
      if (!invoice) throw notFoundError("Invoice not found.");

      await audit({
        actorUserId,
        action: "INVOICE_UPDATED",
        resourceId: id,
        requestId,
        metadata: { status: invoice.status, totalMinor: invoice.totalMinor },
      });

      return serializeInvoiceDetail(
        invoice,
        serializationOptions(config, { includeInternal: true }),
      );
    },

    async issue({ id, actorUserId, requestId }) {
      const current = await invoiceRepository.findRawById(id);
      if (!current) throw notFoundError("Invoice not found.");
      if (current.status !== "DRAFT") {
        throw new HttpError(
          409,
          "INVALID_STATUS_TRANSITION",
          "Only a draft invoice can be issued.",
        );
      }

      await requireClient({ clientId: current.clientId });

      const totals = invoiceTotals({
        lineItems: current.lineItems,
        discountMinor: current.discountMinor,
        taxRateBps: current.taxRateBps,
        config,
      });

      if (totals.totalMinor <= 0) {
        throw badRequest("An invoice total must be greater than zero before it is issued.");
      }
      if (!current.dueDate) {
        throw badRequest("A due date is required before an invoice is issued.", [
          { field: "body.dueDate", message: "Due date is required." },
        ]);
      }

      const issueDate =
        current.issueDate ?? dateOnlyFromToday(now(), config.timezone);
      if (current.dueDate < issueDate) {
        throw badRequest("The due date cannot be before the issue date.", [
          { field: "body.dueDate", message: "Due date is before the issue date." },
        ]);
      }

      let invoiceNumber = current.invoiceNumber;
      if (!invoiceNumber) {
        invoiceNumber = await generateInvoiceNumber(issueDate);
      }

      try {
        const invoice = await invoiceRepository.update({
          id,
          changes: {
            ...totalsChanges(totals),
            invoiceNumber,
            issueDate,
            issuedAt: now(),
            issuedBy: actorUserId,
            status: "ISSUED",
            balanceDueMinor: balanceDueMinor({
              totalMinor: totals.totalMinor,
              amountPaidMinor: current.amountPaidMinor,
              amountRefundedMinor: current.amountRefundedMinor,
            }),
            overpaidMinor: overpaidMinor({
              totalMinor: totals.totalMinor,
              amountPaidMinor: current.amountPaidMinor,
              amountRefundedMinor: current.amountRefundedMinor,
            }),
            updatedBy: actorUserId,
          },
        });

        if (!invoice) throw notFoundError("Invoice not found.");

        await audit({
          actorUserId,
          action: "INVOICE_ISSUED",
          resourceId: id,
          requestId,
          metadata: {
            invoiceNumber,
            totalMinor: invoice.totalMinor,
          },
        });

        return serializeInvoiceDetail(
          invoice,
          serializationOptions(config, { includeInternal: true }),
        );
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          throw new HttpError(
            409,
            "INVOICE_NUMBER_CONFLICT",
            "That invoice number is already in use.",
          );
        }
        throw error;
      }
    },

    async void({ id, reason, actorUserId, requestId }) {
      const current = await invoiceRepository.findRawById(id);
      if (!current) throw notFoundError("Invoice not found.");
      if (current.status === "VOID") {
        throw new HttpError(409, "INVOICE_ALREADY_VOID", "This invoice is already void.");
      }

      const netPaid = Math.max(
        0,
        (current.amountPaidMinor ?? 0) - (current.amountRefundedMinor ?? 0),
      );
      if (netPaid > 0) {
        throw new HttpError(
          409,
          "INVOICE_HAS_PAYMENTS",
          "Refund the verified payments before voiding this invoice.",
        );
      }

      const invoice = await invoiceRepository.update({
        id,
        changes: {
          status: "VOID",
          voidedAt: now(),
          voidedBy: actorUserId,
          voidReason: reason,
          balanceDueMinor: 0,
          overpaidMinor: 0,
          updatedBy: actorUserId,
        },
      });
      if (!invoice) throw notFoundError("Invoice not found.");

      await audit({
        actorUserId,
        action: "INVOICE_VOIDED",
        resourceId: id,
        requestId,
        metadata: { reason },
      });

      return serializeInvoiceDetail(
        invoice,
        serializationOptions(config, { includeInternal: true }),
      );
    },
  };
}

export default createInvoiceService;
