import { createFinanceRuntime } from "../../finance/runtime.js";

export const PAYMENT_SECRET =
  "test-payment-webhook-secret-that-is-long-enough-32";
export const MOCK_SECRET = "test-mock-token-secret-that-is-long-enough-32";

export const FAKE_ENV = Object.freeze({
  isProduction: false,
  frontendUrls: ["http://localhost:3000"],
  mongodbTransactions: false,
  invoiceSupportedCurrencies: ["BDT"],
  invoiceTaxEnabled: false,
  invoiceDiscountEnabled: false,
  invoiceTimezone: "Asia/Dhaka",
  invoiceOverdueGraceDays: 0,
  invoiceNumberPrefix: "INV",
  paymentsEnabled: true,
  paymentProvider: "FAKE",
  paymentEnvironment: "SANDBOX",
  paymentWebhookSecret: PAYMENT_SECRET,
  paymentMockTokenSecret: MOCK_SECRET,
  paymentPublicBaseUrl: "http://api.test",
});

function clone(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date) return new Date(value);
  if (Array.isArray(value)) return value.map(clone);
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)]));
  }
  return value;
}

function matches(value, id) {
  return String(value?._id ?? value) === String(id);
}

/**
 * In-memory invoice/payment repositories used by the DB-free HTTP tests.
 *
 * They mimic the shape of the Mongoose repositories, including the conditional
 * payment transitions, so the real services and route guards are exercised.
 */
export function createFakeFinance({ repositories, data }) {
  const invoices = [];
  const payments = [];
  const events = [];
  const refunds = [];
  const audits = [];
  const counters = new Map();
  let nextId = 1;

  const newId = () => `64c000000000000000${String(nextId++).padStart(6, "0")}`;
  const clients = data.clients;
  const projects = data.projects;

  function rawInvoice(invoice) {
    return clone(invoice);
  }

  function populatedInvoice(invoice) {
    if (!invoice) return null;
    const copy = clone(invoice);
    copy.clientId = clone(
      clients.find((client) => matches(client._id, invoice.clientId)) ??
        invoice.clientId,
    );
    copy.projectId = clone(
      projects.find((project) => matches(project._id, invoice.projectId)) ??
        invoice.projectId,
    );
    return copy;
  }

  function filterInvoices(query = {}) {
    let filtered = [...invoices];
    if (query.status) filtered = filtered.filter((item) => item.status === query.status);
    if (query.clientId) {
      filtered = filtered.filter((item) => matches(item.clientId, query.clientId));
    }
    if (query.projectId) {
      filtered = filtered.filter((item) => matches(item.projectId, query.projectId));
    }
    if (query.search) {
      const term = String(query.search).toLowerCase();
      filtered = filtered.filter((item) =>
        [item.invoiceNumber, item.notes, item.internalNotes]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term)),
      );
    }
    return filtered;
  }

  function sortInvoices(items, sort = "createdAt", order = "desc") {
    const direction = order === "asc" ? 1 : -1;
    return items.sort((left, right) => {
      const a = left[sort] ?? "";
      const b = right[sort] ?? "";
      if (a < b) return -1 * direction;
      if (a > b) return 1 * direction;
      return 0;
    });
  }

  const invoiceRepository = {
    async list(query) {
      const filtered = sortInvoices(filterInvoices(query), query.sort, query.order);
      const start = (query.page - 1) * query.limit;
      return {
        items: filtered.slice(start, start + query.limit).map(populatedInvoice),
        total: filtered.length,
      };
    },
    async listForClient({ clientId, page, limit, status }) {
      if (status === "DRAFT") return { items: [], total: 0 };

      let filtered = invoices.filter(
        (item) => matches(item.clientId, clientId) && item.status !== "DRAFT",
      );
      if (status) filtered = filtered.filter((item) => item.status === status);
      filtered = sortInvoices(filtered);
      const start = (page - 1) * limit;
      return {
        items: filtered.slice(start, start + limit).map(populatedInvoice),
        total: filtered.length,
      };
    },
    async findById(id) {
      return populatedInvoice(invoices.find((item) => matches(item._id, id)));
    },
    async findRawById(id) {
      return rawInvoice(invoices.find((item) => matches(item._id, id)));
    },
    async findDocumentById(id) {
      return rawInvoice(invoices.find((item) => matches(item._id, id)));
    },
    async findForClient({ id, clientId }) {
      return rawInvoice(
        invoices.find(
          (item) =>
            matches(item._id, id) &&
            matches(item.clientId, clientId) &&
            item.status !== "DRAFT",
        ),
      );
    },
    async findForClientDetail({ id, clientId }) {
      return populatedInvoice(
        invoices.find(
          (item) =>
            matches(item._id, id) &&
            matches(item.clientId, clientId) &&
            item.status !== "DRAFT",
        ),
      );
    },
    async create(input) {
      const now = new Date();
      const invoice = {
        _id: newId(),
        ...clone(input),
        createdAt: now,
        updatedAt: now,
      };
      invoices.push(invoice);
      return populatedInvoice(invoice);
    },
    async update({ id, changes }) {
      const invoice = invoices.find((item) => matches(item._id, id));
      if (!invoice) return null;
      for (const [key, value] of Object.entries(changes)) {
        if (value === undefined || value === null) delete invoice[key];
        else invoice[key] = clone(value);
      }
      invoice.updatedAt = new Date();
      return populatedInvoice(invoice);
    },
    async save(invoice) {
      return populatedInvoice(invoice);
    },
    async applyVerifiedPayment({ invoiceId, amountMinor, status }) {
      const invoice = invoices.find((item) => matches(item._id, invoiceId));
      if (!invoice) return null;
      invoice.amountPaidMinor += amountMinor;
      invoice.balanceDueMinor = Math.max(
        0,
        invoice.totalMinor - (invoice.amountPaidMinor - invoice.amountRefundedMinor),
      );
      invoice.overpaidMinor = Math.max(
        0,
        invoice.amountPaidMinor - invoice.amountRefundedMinor - invoice.totalMinor,
      );
      invoice.status = status;
      invoice.updatedAt = new Date();
      return clone(invoice);
    },
    async applyVerifiedRefund({ invoiceId, amountMinor, status }) {
      const invoice = invoices.find((item) => matches(item._id, invoiceId));
      if (!invoice) return null;
      invoice.amountRefundedMinor += amountMinor;
      invoice.balanceDueMinor = Math.max(
        0,
        invoice.totalMinor - (invoice.amountPaidMinor - invoice.amountRefundedMinor),
      );
      invoice.overpaidMinor = Math.max(
        0,
        invoice.amountPaidMinor - invoice.amountRefundedMinor - invoice.totalMinor,
      );
      invoice.status = status;
      invoice.updatedAt = new Date();
      return clone(invoice);
    },
  };

  function populatedPayment(payment) {
    if (!payment) return null;
    const copy = clone(payment);
    copy.invoiceId = populatedInvoice(
      invoices.find((invoice) => matches(invoice._id, payment.invoiceId)),
    ) ?? payment.invoiceId;
    copy.clientId = clone(
      clients.find((client) => matches(client._id, payment.clientId)) ??
        payment.clientId,
    );
    return copy;
  }

  function rawPayment(payment) {
    return clone(payment);
  }

  const paymentRepository = {
    async list(query = {}) {
      let filtered = [...payments];
      if (query.status) filtered = filtered.filter((item) => item.status === query.status);
      if (query.invoiceId) {
        filtered = filtered.filter((item) => matches(item.invoiceId, query.invoiceId));
      }
      if (query.clientId) {
        filtered = filtered.filter((item) => matches(item.clientId, query.clientId));
      }
      filtered.sort((a, b) => b.createdAt - a.createdAt);
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const start = (page - 1) * limit;
      return {
        items: filtered.slice(start, start + limit).map(populatedPayment),
        total: filtered.length,
      };
    },
    async findById(id) {
      return populatedPayment(payments.find((item) => matches(item._id, id)));
    },
    async findRawById(id) {
      return rawPayment(payments.find((item) => matches(item._id, id)));
    },
    async findDocumentById(id) {
      return rawPayment(payments.find((item) => matches(item._id, id)));
    },
    async findForClient({ id, clientId }) {
      return rawPayment(
        payments.find(
          (item) => matches(item._id, id) && matches(item.clientId, clientId),
        ),
      );
    },
    async findByIdempotencyKey(key) {
      return rawPayment(payments.find((item) => item.idempotencyKey === key));
    },
    async create(input) {
      const now = new Date();
      const payment = { _id: newId(), ...clone(input), createdAt: now, updatedAt: now };
      payments.push(payment);
      return clone(payment);
    },
    async markSucceeded({ id, providerPaymentId, providerMethod }) {
      const payment = payments.find((item) => matches(item._id, id));
      if (!payment || !["INITIATED", "PENDING"].includes(payment.status)) return null;
      payment.status = "SUCCEEDED";
      payment.verifiedAt = new Date();
      if (providerPaymentId) payment.providerPaymentId = providerPaymentId;
      if (providerMethod) payment.providerMethod = providerMethod;
      delete payment.safeFailureCode;
      return clone(payment);
    },
    async markAttemptTerminal({ id, status, safeFailureCode }) {
      const payment = payments.find((item) => matches(item._id, id));
      if (!payment || !["INITIATED", "PENDING"].includes(payment.status)) return null;
      payment.status = status;
      payment.failedAt = new Date();
      if (safeFailureCode) payment.safeFailureCode = safeFailureCode;
      return clone(payment);
    },
    async update({ id, changes }) {
      const payment = payments.find((item) => matches(item._id, id));
      if (!payment) return null;
      for (const [key, value] of Object.entries(changes)) {
        if (value === undefined || value === null) delete payment[key];
        else payment[key] = clone(value);
      }
      payment.updatedAt = new Date();
      return clone(payment);
    },
    async save(payment) {
      return clone(payment);
    },
    async applyRefund({ id, amountMinor }) {
      const payment = payments.find((item) => matches(item._id, id));
      if (!payment) return null;
      if (payment.refundedAmountMinor + amountMinor > payment.amountMinor) {
        return null;
      }
      payment.refundedAmountMinor += amountMinor;
      payment.status =
        payment.refundedAmountMinor >= payment.amountMinor
          ? "REFUNDED"
          : "PARTIALLY_REFUNDED";
      payment.updatedAt = new Date();
      return clone(payment);
    },
  };

  const eventRepository = {
    async findByProviderEventId({ provider, eventId }) {
      return clone(
        events.find(
          (event) => event.provider === provider && event.eventId === eventId,
        ),
      );
    },
    async create(input) {
      if (
        events.some(
          (event) =>
            event.provider === input.provider && event.eventId === input.eventId,
        )
      ) {
        const error = new Error("duplicate event");
        error.code = 11000;
        throw error;
      }
      const event = { _id: newId(), ...clone(input), attempts: 0 };
      events.push(event);
      return clone(event);
    },
    async markProcessed({ id }) {
      const event = events.find((item) => matches(item._id, id));
      if (!event) return null;
      event.status = "PROCESSED";
      event.processedAt = new Date();
      return clone(event);
    },
    async markIgnored({ id, safeErrorCode }) {
      const event = events.find((item) => matches(item._id, id));
      if (!event) return null;
      event.status = "IGNORED";
      event.processedAt = new Date();
      if (safeErrorCode) event.safeErrorCode = safeErrorCode;
      return clone(event);
    },
    async markFailed({ id, safeErrorCode }) {
      const event = events.find((item) => matches(item._id, id));
      if (!event) return null;
      event.status = "FAILED";
      event.attempts += 1;
      if (safeErrorCode) event.safeErrorCode = safeErrorCode;
      return clone(event);
    },
  };

  const refundRepository = {
    async create(input) {
      const refund = { _id: newId(), ...clone(input), createdAt: new Date() };
      refunds.push(refund);
      return clone(refund);
    },
    async findById(id) {
      return clone(refunds.find((refund) => matches(refund._id, id)));
    },
    async listForPayment(paymentId) {
      return refunds
        .filter((refund) => matches(refund.paymentId, paymentId))
        .map(clone);
    },
    async listForInvoice(invoiceId) {
      return refunds
        .filter((refund) => matches(refund.invoiceId, invoiceId))
        .map(clone);
    },
    async markSucceeded({ id, providerRefundId }) {
      const refund = refunds.find((item) => matches(item._id, id));
      if (!refund) return null;
      refund.status = "SUCCEEDED";
      refund.completedAt = new Date();
      if (providerRefundId) refund.providerRefundId = providerRefundId;
      return clone(refund);
    },
    async markFailed({ id, safeErrorCode }) {
      const refund = refunds.find((item) => matches(item._id, id));
      if (!refund) return null;
      refund.status = "FAILED";
      if (safeErrorCode) refund.safeErrorCode = safeErrorCode;
      return clone(refund);
    },
  };

  const auditRepository = {
    async record(input) {
      const event = { _id: newId(), ...clone(input), createdAt: new Date() };
      audits.push(event);
      return event;
    },
  };

  const counterRepository = {
    async next({ prefix, year }) {
      const key = `${prefix}:${year}`;
      const sequence = (counters.get(key) ?? 0) + 1;
      counters.set(key, sequence);
      return sequence;
    },
  };

  const financeRepositories = {
    ...repositories,
    invoices: invoiceRepository,
    counters: counterRepository,
    payments: paymentRepository,
    events: eventRepository,
    refunds: refundRepository,
    audit: auditRepository,
  };

  const finance = createFinanceRuntime({
    env: FAKE_ENV,
    repositories: financeRepositories,
    transactionRunner: async (callback) => callback(null),
  });

  return {
    finance,
    repositories: financeRepositories,
    stores: { invoices, payments, events, refunds, audits, counters },
  };
}

export default createFakeFinance;
