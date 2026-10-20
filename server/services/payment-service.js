import crypto from "node:crypto";
import mongoose from "mongoose";
import { PAYMENT_LIMITS } from "../constants/payment.js";
import { PaymentProviderError } from "../payments/payment-provider-error.js";
import { isDuplicateKeyError } from "../utils/mongo-errors.js";
import {
  balanceDueMinor,
  overpaidMinor,
} from "../utils/money.js";
import { deriveInvoiceStatus } from "../utils/invoice-status.js";
import {
  badRequest,
  HttpError,
  notFoundError,
} from "../utils/http-error.js";
import {
  serializePaymentDetail,
  serializePaymentSummary,
  serializePortalPayment,
} from "../utils/serializers.js";

const DEFAULT_CONFIG = Object.freeze({
  paymentsEnabled: false,
  environment: "SANDBOX",
  timezone: "Asia/Dhaka",
  overdueGraceDays: 0,
  publicBaseUrl: "http://localhost:5000",
  frontendUrl: "http://localhost:3000",
  transactions: true,
});

function normalizedConfig(config = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    publicBaseUrl: String(
      config.publicBaseUrl ?? DEFAULT_CONFIG.publicBaseUrl,
    ).replace(/\/+$/, ""),
    frontendUrl: String(
      config.frontendUrl ?? DEFAULT_CONFIG.frontendUrl,
    ).replace(/\/+$/, ""),
  };
}

function payloadHash(value) {
  return crypto
    .createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex");
}

function providerEventStatus(status) {
  if (status === "SUCCEEDED") return "SUCCEEDED";
  if (status === "CANCELLED") return "CANCELLED";
  if (status === "EXPIRED") return "EXPIRED";
  return "FAILED";
}

function defaultTransactionRunner({ transactions }) {
  return async (callback) => {
    if (!transactions) return callback(null);

    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        result = await callback(session);
      });
      return result;
    } finally {
      await session.endSession();
    }
  };
}

export function createPaymentService({
  paymentRepository,
  invoiceRepository,
  paymentEventRepository,
  refundRepository,
  auditRepository,
  provider = null,
  config: rawConfig = {},
  transactionRunner,
  now = () => new Date(),
} = {}) {
  if (
    !paymentRepository ||
    !invoiceRepository ||
    !paymentEventRepository ||
    !refundRepository
  ) {
    throw new Error("Payment service dependencies are incomplete.");
  }

  const config = normalizedConfig(rawConfig);
  const runTransaction =
    transactionRunner ?? defaultTransactionRunner({ transactions: config.transactions });

  async function audit(data, session = null) {
    if (!auditRepository) return;
    try {
      await auditRepository.record(
        {
          ...data,
          resourceType: data.resourceType ?? "PAYMENT",
          outcome: data.outcome ?? "SUCCESS",
        },
        session,
      );
    } catch {
      // An audit write must never make an already-verified money event fail.
    }
  }

  function requirePaymentProvider() {
    if (!provider || !config.paymentsEnabled) {
      throw new HttpError(
        503,
        "PAYMENTS_DISABLED",
        "Online payments are not enabled for this environment.",
      );
    }
  }

  function requireProviderPayment(payment) {
    if (payment.provider !== provider.name) {
      throw new HttpError(
        409,
        "PROVIDER_MISMATCH",
        "This payment belongs to a different payment provider.",
      );
    }
  }

  function frontendPaymentUrl(paymentId) {
    return `${config.frontendUrl}/portal/payments/${paymentId}`;
  }

  async function checkoutForPayment({ payment, invoice }) {
    const result = await provider.createCheckout({
      payment,
      invoice,
      returnUrl: frontendPaymentUrl(payment._id ?? payment.id),
      cancelUrl: frontendPaymentUrl(payment._id ?? payment.id),
      webhookUrl: `${config.publicBaseUrl}/api/v1/webhooks/payments/${provider.name.toLowerCase()}`,
    });

    if (!result?.checkoutUrl) {
      throw new PaymentProviderError(
        "CHECKOUT_UNAVAILABLE",
        "The payment provider did not return a checkout URL.",
      );
    }

    return result;
  }

  async function findEvent({ providerName, eventId }) {
    return paymentEventRepository.findByProviderEventId({
      provider: providerName,
      eventId,
    });
  }

  async function ensureEventRecord(event) {
    const existing = await findEvent({
      providerName: event.provider,
      eventId: event.eventId,
    });
    if (existing) return { event: existing, created: false };

    try {
      const created = await paymentEventRepository.create({
        provider: event.provider,
        eventId: event.eventId,
        eventType: event.eventType,
        payloadHash: event.payloadHash ?? payloadHash(event),
        paymentId: event.paymentId,
        invoiceId: event.invoiceId,
        status: "RECEIVED",
        receivedAt: now(),
      });
      return { event: created, created: true };
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      const raced = await findEvent({
        providerName: event.provider,
        eventId: event.eventId,
      });
      if (!raced) throw error;
      return { event: raced, created: false };
    }
  }

  async function applySucceededEvent({ event, session }) {
    const payment = await paymentRepository.findRawById(event.paymentId, session);
    if (!payment) return { kind: "ignored", reason: "PAYMENT_NOT_FOUND" };

    if (payment.provider !== event.provider) {
      return { kind: "ignored", reason: "PROVIDER_MISMATCH" };
    }

    if (
      event.providerTransactionId &&
      payment.providerTransactionId &&
      event.providerTransactionId !== payment.providerTransactionId
    ) {
      return { kind: "ignored", reason: "TRANSACTION_MISMATCH" };
    }

    if (
      Number(event.amountMinor) !== Number(payment.amountMinor) ||
      event.currency !== payment.currency
    ) {
      return { kind: "ignored", reason: "AMOUNT_MISMATCH" };
    }

    if (["SUCCEEDED", "PARTIALLY_REFUNDED", "REFUNDED"].includes(payment.status)) {
      return { kind: "duplicate" };
    }

    if (!["INITIATED", "PENDING"].includes(payment.status)) {
      return { kind: "ignored", reason: "PAYMENT_NOT_PENDING" };
    }

    const invoice = await invoiceRepository.findRawById(
      payment.invoiceId,
      session,
    );
    if (!invoice) return { kind: "ignored", reason: "INVOICE_NOT_FOUND" };

    const balanceBefore = balanceDueMinor({
      totalMinor: invoice.totalMinor,
      amountPaidMinor: invoice.amountPaidMinor,
      amountRefundedMinor: invoice.amountRefundedMinor,
    });

    const marked = await paymentRepository.markSucceeded({
      id: payment._id,
      providerPaymentId: event.providerPaymentId,
      providerMethod: event.paymentMethod,
      session,
    });

    if (!marked) {
      const latest = await paymentRepository.findRawById(payment._id, session);
      if (
        latest &&
        ["SUCCEEDED", "PARTIALLY_REFUNDED", "REFUNDED"].includes(latest.status)
      ) {
        return { kind: "duplicate" };
      }
      return { kind: "ignored", reason: "PAYMENT_STATUS_CONFLICT" };
    }

    const status = deriveInvoiceStatus({
      currentStatus: invoice.status,
      totalMinor: invoice.totalMinor,
      amountPaidMinor: invoice.amountPaidMinor + payment.amountMinor,
      amountRefundedMinor: invoice.amountRefundedMinor,
      dueDate: invoice.dueDate,
      graceDays: config.overdueGraceDays,
      now: now(),
      timeZone: config.timezone,
    });

    const updatedInvoice = await invoiceRepository.applyVerifiedPayment({
      invoiceId: payment.invoiceId,
      amountMinor: payment.amountMinor,
      status,
      session,
    });
    if (!updatedInvoice) {
      throw new HttpError(
        409,
        "INVOICE_NOT_FOUND",
        "The payment's invoice no longer exists.",
      );
    }

    await paymentRepository.update({
      id: payment._id,
      changes: {
        appliedAmountMinor: payment.amountMinor,
        overpaidMinor: overpaidMinor({
          totalMinor: invoice.totalMinor,
          amountPaidMinor: invoice.amountPaidMinor + payment.amountMinor,
          amountRefundedMinor: invoice.amountRefundedMinor,
        }),
        providerPaymentId: event.providerPaymentId ?? payment.providerPaymentId,
        providerMethod: event.paymentMethod ?? payment.providerMethod,
      },
      session,
    });

    return {
      kind: "processed",
      payment,
      invoiceId: payment.invoiceId,
      balanceBefore,
    };
  }

  async function applyFailedEvent({ event, session }) {
    const payment = await paymentRepository.findRawById(event.paymentId, session);
    if (!payment) return { kind: "ignored", reason: "PAYMENT_NOT_FOUND" };

    if (payment.provider !== event.provider) {
      return { kind: "ignored", reason: "PROVIDER_MISMATCH" };
    }

    if (["SUCCEEDED", "PARTIALLY_REFUNDED", "REFUNDED"].includes(payment.status)) {
      return { kind: "ignored", reason: "PAYMENT_ALREADY_SUCCEEDED" };
    }

    if (!["INITIATED", "PENDING"].includes(payment.status)) {
      return { kind: "duplicate" };
    }

    const terminal = providerEventStatus(event.status);
    const marked = await paymentRepository.markAttemptTerminal({
      id: payment._id,
      status: terminal,
      safeFailureCode: `PROVIDER_${terminal}`,
      session,
    });
    if (!marked) return { kind: "duplicate" };
    return { kind: "processed", payment: marked, terminal: true };
  }

  async function processVerifiedEvent(event, { requestId } = {}) {
    if (!provider) {
      throw new HttpError(
        503,
        "PAYMENTS_DISABLED",
        "Online payments are not enabled for this environment.",
      );
    }

    const providerName = provider.name;
    if (String(event.provider ?? providerName).toUpperCase() !== providerName) {
      throw badRequest("Payment provider mismatch.");
    }

    const normalized = {
      ...event,
      provider: providerName,
      payloadHash: event.payloadHash ?? payloadHash(event),
    };

    const paymentPre = await paymentRepository.findRawById(normalized.paymentId);
    if (!paymentPre) {
      return { processed: false, ignored: true, reason: "PAYMENT_NOT_FOUND" };
    }
    if (normalized.invoiceId && String(paymentPre.invoiceId) !== String(normalized.invoiceId)) {
      return { processed: false, ignored: true, reason: "INVOICE_MISMATCH" };
    }
    normalized.invoiceId = paymentPre.invoiceId;

    const { event: eventRecord } = await ensureEventRecord(normalized);
    if (eventRecord.status === "PROCESSED") {
      return { processed: false, duplicate: true };
    }

    try {
      const result = await runTransaction(async (session) => {
        const outcome =
          normalized.status === "SUCCEEDED"
            ? await applySucceededEvent({ event: normalized, session })
            : await applyFailedEvent({ event: normalized, session });

        if (outcome.kind === "processed") {
          await paymentEventRepository.markProcessed({
            id: eventRecord._id,
            session,
          });
          await audit(
            {
              action:
                normalized.status === "SUCCEEDED"
                  ? "PAYMENT_VERIFIED"
                  : "PAYMENT_FAILED",
              resourceId: normalized.paymentId,
              actorUserId: "provider",
              requestId,
              outcome: "SUCCESS",
              metadata: {
                provider: providerName,
                eventId: normalized.eventId,
                status: normalized.status,
                amountMinor: normalized.amountMinor,
                currency: normalized.currency,
              },
            },
            session,
          );
        } else if (outcome.kind === "duplicate") {
          await paymentEventRepository.markProcessed({
            id: eventRecord._id,
            session,
          });
        } else {
          await paymentEventRepository.markIgnored({
            id: eventRecord._id,
            safeErrorCode: outcome.reason,
            session,
          });
          await audit(
            {
              action: "PAYMENT_EVENT_IGNORED",
              resourceId: normalized.paymentId,
              actorUserId: "provider",
              requestId,
              outcome: "FAILURE",
              metadata: {
                provider: providerName,
                eventId: normalized.eventId,
                reason: outcome.reason,
              },
            },
            session,
          );
        }

        return outcome;
      });

      return {
        processed: result.kind === "processed",
        duplicate: result.kind === "duplicate",
        ignored: result.kind === "ignored",
        reason: result.reason,
      };
    } catch (error) {
      await paymentEventRepository.markFailed({
        id: eventRecord._id,
        safeErrorCode: "EVENT_PROCESSING_FAILED",
      });
      throw error;
    }
  }

  return {
    config,

    async createSession({
      invoiceId,
      clientId,
      amountMinor,
      idempotencyKey,
      user,
      requestId,
    }) {
      requirePaymentProvider();

      const invoice = await invoiceRepository.findForClient({
        id: invoiceId,
        clientId,
      });
      if (!invoice) throw notFoundError("Invoice not found.");

      const status = deriveInvoiceStatus({
        currentStatus: invoice.status,
        totalMinor: invoice.totalMinor,
        amountPaidMinor: invoice.amountPaidMinor,
        amountRefundedMinor: invoice.amountRefundedMinor,
        dueDate: invoice.dueDate,
        graceDays: config.overdueGraceDays,
        now: now(),
        timeZone: config.timezone,
      });

      if (["DRAFT", "VOID", "PAID"].includes(status)) {
        throw new HttpError(
          409,
          "INVOICE_NOT_PAYABLE",
          "This invoice is not currently payable.",
        );
      }

      const balance = balanceDueMinor({
        totalMinor: invoice.totalMinor,
        amountPaidMinor: invoice.amountPaidMinor,
        amountRefundedMinor: invoice.amountRefundedMinor,
      });
      if (balance <= 0) {
        throw new HttpError(
          409,
          "INVOICE_NOT_PAYABLE",
          "This invoice has no outstanding balance.",
        );
      }

      const requestedAmount = amountMinor ?? balance;
      if (
        !Number.isSafeInteger(requestedAmount) ||
        requestedAmount < PAYMENT_LIMITS.amountMinor.min
      ) {
        throw badRequest("The payment amount is invalid.");
      }
      if (requestedAmount > balance) {
        throw badRequest("The payment amount cannot exceed the outstanding balance.", [
          {
            field: "body.amountMinor",
            message: "Amount exceeds the current balance.",
          },
        ]);
      }

      if (idempotencyKey) {
        const existing = await paymentRepository.findByIdempotencyKey(idempotencyKey);
        if (existing) {
          if (
            String(existing.invoiceId) !== String(invoice._id ?? invoice.id) ||
            String(existing.clientId) !== String(clientId)
          ) {
            throw new HttpError(
              409,
              "IDEMPOTENCY_KEY_REUSED",
              "This idempotency key belongs to another payment.",
            );
          }

          if (["SUCCEEDED", "PARTIALLY_REFUNDED", "REFUNDED"].includes(existing.status)) {
            return {
              payment: serializePortalPayment(existing),
              checkoutUrl: null,
              alreadyPaid: true,
            };
          }

          if (["INITIATED", "PENDING"].includes(existing.status)) {
            const checkout = await checkoutForPayment({
              payment: existing,
              invoice,
            });
            return {
              payment: serializePortalPayment(existing),
              checkoutUrl: checkout.checkoutUrl,
            };
          }

          throw new HttpError(
            409,
            "PAYMENT_NOT_RETRYABLE",
            "This payment attempt can no longer be retried.",
          );
        }
      }

      // A second request with a different idempotency key (a double-click that
      // raced past the browser guard, or two open tabs) must not create a
      // second chargeable checkout for the same invoice. Reuse the active
      // attempt when the amount matches; reject a conflicting amount instead of
      // silently changing what the client is paying.
      const active = await paymentRepository.findActiveForInvoice({
        invoiceId: invoice._id ?? invoice.id,
        clientId,
      });
      if (active) {
        if (Number(active.amountMinor) !== requestedAmount) {
          throw new HttpError(
            409,
            "PAYMENT_ALREADY_PENDING",
            "A payment attempt for this invoice is already in progress. Complete it or contact Growers Journy before starting a different amount.",
          );
        }

        try {
          const checkout = await checkoutForPayment({
            payment: active,
            invoice,
          });
          return {
            payment: serializePortalPayment(active),
            checkoutUrl: checkout.checkoutUrl,
            existing: true,
          };
        } catch {
          throw new HttpError(
            502,
            "PAYMENT_PROVIDER_UNAVAILABLE",
            "The payment provider is temporarily unavailable. Please try again.",
          );
        }
      }

      const providerTransactionId = `GJ-${crypto.randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase()}`;

      let created;
      try {
        created = await paymentRepository.create({
          invoiceId: invoice._id ?? invoice.id,
          clientId,
          provider: provider.name,
          environment: config.environment,
          providerTransactionId,
          idempotencyKey: idempotencyKey ?? undefined,
          amountMinor: requestedAmount,
          appliedAmountMinor: 0,
          overpaidMinor: 0,
          refundedAmountMinor: 0,
          currency: invoice.currency,
          status: "INITIATED",
          initiatedByUserId: user?.id,
          initiatedAt: now(),
        });
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          throw new HttpError(
            409,
            "PAYMENT_ALREADY_STARTED",
            "A payment attempt was already started. Refresh the invoice and try again.",
          );
        }
        throw error;
      }

      try {
        const checkout = await checkoutForPayment({
          payment: created,
          invoice,
        });
        const payment = await paymentRepository.update({
          id: created._id ?? created.id,
          changes: {
            status: "PENDING",
            providerTransactionId:
              checkout.providerTransactionId ?? providerTransactionId,
          },
        });

        await audit({
          action: "PAYMENT_INITIATED",
          resourceId: created._id ?? created.id,
          actorUserId: user?.id,
          requestId,
          metadata: {
            invoiceId: String(invoice._id ?? invoice.id),
            amountMinor: requestedAmount,
            currency: invoice.currency,
            provider: provider.name,
          },
        });

        return {
          payment: serializePortalPayment(payment),
          checkoutUrl: checkout.checkoutUrl,
        };
      } catch (error) {
        await paymentRepository.markAttemptTerminal({
          id: created._id ?? created.id,
          status: "FAILED",
          safeFailureCode:
            error instanceof PaymentProviderError
              ? error.code
              : "CHECKOUT_CREATION_FAILED",
        });
        await audit({
          action: "PAYMENT_INITIATION_FAILED",
          resourceId: created._id ?? created.id,
          actorUserId: user?.id,
          requestId,
          outcome: "FAILURE",
          metadata: { invoiceId: String(invoice._id ?? invoice.id), provider: provider.name },
        });
        throw new HttpError(
          502,
          "PAYMENT_PROVIDER_UNAVAILABLE",
          "The payment provider is temporarily unavailable. Please try again.",
        );
      }
    },

    async list(query) {
      const { items, total } = await paymentRepository.list(query);
      return {
        items: items.map((payment) =>
          serializePaymentSummary(payment, {
            includeInternal: true,
            includeProviderRefs: true,
            includeClient: true,
          }),
        ),
        total,
      };
    },

    async listForClientInvoice({ invoiceId, clientId }) {
      const { items } = await paymentRepository.list({
        page: 1,
        limit: 100,
        invoiceId,
        clientId,
        sort: "createdAt",
        order: "desc",
      });
      return items.map(serializePortalPayment);
    },

    async getById(id) {
      const payment = await paymentRepository.findById(id);
      if (!payment) throw notFoundError("Payment not found.");
      const refunds = await refundRepository.listForPayment(payment._id);
      return serializePaymentDetail(
        { ...payment, refunds },
        { includeInternal: true, includeProviderRefs: true, includeClient: true },
      );
    },

    async getForClient({ id, clientId }) {
      const payment = await paymentRepository.findForClient({ id, clientId });
      if (!payment) throw notFoundError("Payment not found.");
      return serializePortalPayment(payment);
    },

    async getMockCheckout({ paymentId, token }) {
      requirePaymentProvider();
      if (!provider.verifyMockToken || !provider.verifyMockToken({ paymentId, token })) {
        throw new HttpError(
          403,
          "INVALID_MOCK_TOKEN",
          "The mock payment link is invalid.",
        );
      }

      const payment = await paymentRepository.findRawById(paymentId);
      if (!payment) throw notFoundError("Payment not found.");
      requireProviderPayment(payment);

      const invoice = await invoiceRepository.findRawById(payment.invoiceId);

      return {
        id: String(payment._id ?? payment.id),
        invoiceNumber: invoice?.invoiceNumber ?? null,
        amountMinor: payment.amountMinor,
        currency: payment.currency,
        status: payment.status,
        provider: payment.provider,
        environment: payment.environment,
        isPayable: ["INITIATED", "PENDING"].includes(payment.status),
      };
    },

    async processWebhook({ providerName, rawBody, headers, requestId }) {
      requirePaymentProvider();
      if (String(providerName).toUpperCase() !== provider.name) {
        throw notFoundError("Payment provider not configured.");
      }

      let event;
      try {
        event = provider.verifyWebhook({ rawBody, headers });
      } catch (error) {
        if (error instanceof PaymentProviderError) {
          throw new HttpError(
            400,
            error.code,
            "The payment event could not be verified.",
          );
        }
        throw error;
      }

      return processVerifiedEvent(event, { requestId });
    },

    async completeMockPayment({ paymentId, token, outcome, requestId }) {
      requirePaymentProvider();
      if (!provider.verifyMockToken || !provider.verifyMockToken({ paymentId, token })) {
        throw new HttpError(
          403,
          "INVALID_MOCK_TOKEN",
          "The mock payment link is invalid.",
        );
      }

      const payment = await paymentRepository.findRawById(paymentId);
      if (!payment) throw notFoundError("Payment not found.");
      requireProviderPayment(payment);

      if (!["INITIATED", "PENDING"].includes(payment.status)) {
        return { processed: false, duplicate: true };
      }

      const event = provider.buildMockEvent({
        payment,
        outcome,
        amountMinor: payment.amountMinor,
      });
      return processVerifiedEvent(event, { requestId });
    },

    async refund({ paymentId, amountMinor, reason, actorUserId, requestId }) {
      requirePaymentProvider();
      if (!provider.supportsRefunds) {
        throw new HttpError(
          409,
          "REFUNDS_NOT_SUPPORTED",
          "The configured payment provider does not support refunds.",
        );
      }

      const payment = await paymentRepository.findRawById(paymentId);
      if (!payment) throw notFoundError("Payment not found.");
      requireProviderPayment(payment);
      if (!["SUCCEEDED", "PARTIALLY_REFUNDED"].includes(payment.status)) {
        throw new HttpError(
          409,
          "PAYMENT_NOT_REFUNDABLE",
          "Only a verified payment can be refunded.",
        );
      }

      const remaining =
        (payment.amountMinor ?? 0) - (payment.refundedAmountMinor ?? 0);
      if (!Number.isSafeInteger(amountMinor) || amountMinor < 1) {
        throw badRequest("The refund amount is invalid.");
      }
      if (amountMinor > remaining) {
        throw badRequest("The refund amount exceeds the refundable balance.");
      }

      let providerResult;
      try {
        providerResult = await provider.refund({ payment, amountMinor });
      } catch (error) {
        throw new HttpError(
          502,
          "REFUND_FAILED",
          "The payment provider could not process the refund.",
        );
      }

      if (providerResult?.status !== "SUCCEEDED") {
        throw new HttpError(
          409,
          "REFUND_NOT_CONFIRMED",
          "The refund was not confirmed by the provider.",
        );
      }

      const result = await runTransaction(async (session) => {
        const refund = await refundRepository.create(
          {
            paymentId: payment._id,
            invoiceId: payment.invoiceId,
            provider: payment.provider,
            providerRefundId: providerResult.providerRefundId,
            amountMinor,
            status: "REQUESTED",
            reason,
            initiatedBy: actorUserId,
          },
          session,
        );
        const succeeded = await refundRepository.markSucceeded({
          id: refund._id,
          providerRefundId: providerResult.providerRefundId,
          session,
        });

        const updatedPayment = await paymentRepository.applyRefund({
          id: payment._id,
          amountMinor,
          session,
        });
        if (!updatedPayment) {
          throw new HttpError(
            409,
            "REFUND_CONFLICT",
            "The payment refundable balance changed. Refresh and try again.",
          );
        }

        const invoice = await invoiceRepository.findRawById(
          payment.invoiceId,
          session,
        );
        if (!invoice) throw notFoundError("Invoice not found.");

        const status = deriveInvoiceStatus({
          currentStatus: invoice.status,
          totalMinor: invoice.totalMinor,
          amountPaidMinor: invoice.amountPaidMinor,
          amountRefundedMinor: invoice.amountRefundedMinor + amountMinor,
          dueDate: invoice.dueDate,
          graceDays: config.overdueGraceDays,
          now: now(),
          timeZone: config.timezone,
        });

        const updatedInvoice = await invoiceRepository.applyVerifiedRefund({
          invoiceId: payment.invoiceId,
          amountMinor,
          status,
          session,
        });
        if (!updatedInvoice) {
          throw notFoundError("Invoice not found.");
        }

        await audit(
          {
            action: "PAYMENT_REFUNDED",
            resourceId: payment._id,
            actorUserId,
            requestId,
            outcome: "SUCCESS",
            metadata: {
              amountMinor,
              currency: payment.currency,
              provider: payment.provider,
            },
          },
          session,
        );

        return { refund: succeeded, payment: updatedPayment };
      });

      return {
        refund: {
          id: String(result.refund._id),
          amountMinor: result.refund.amountMinor,
          status: result.refund.status,
          reason: result.refund.reason ?? null,
          createdAt: result.refund.createdAt
            ? new Date(result.refund.createdAt).toISOString()
            : null,
        },
        payment: serializePaymentDetail(result.payment, {
          includeInternal: true,
          includeProviderRefs: true,
        }),
      };
    },

    async reconcile({ paymentId, requestId }) {
      requirePaymentProvider();
      const payment = await paymentRepository.findRawById(paymentId);
      if (!payment) throw notFoundError("Payment not found.");
      requireProviderPayment(payment);
      if (!provider.getStatus || !provider.buildMockEvent) {
        throw new HttpError(
          409,
          "RECONCILIATION_NOT_SUPPORTED",
          "The configured payment provider does not support reconciliation.",
        );
      }

      const status = await provider.getStatus({ payment });
      if (status?.status !== "SUCCEEDED" || payment.status !== "PENDING") {
        return { reconciled: false, status: status?.status ?? payment.status };
      }

      const event = provider.buildMockEvent({
        payment,
        outcome: "success",
      });
      const result = await processVerifiedEvent(
        {
          ...event,
          eventId: `reconcile:${payment._id}:SUCCEEDED`,
        },
        { requestId },
      );
      return { reconciled: result.processed, status: "SUCCEEDED" };
    },
  };
}

export default createPaymentService;
