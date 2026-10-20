import crypto from "node:crypto";
import { PaymentProviderError } from "./payment-provider-error.js";

/**
 * Mock payment provider.
 *
 * This adapter exists so the whole payment lifecycle can be exercised without a
 * merchant account: create a payment session, open a clearly labelled mock
 * checkout page, emit a signed provider event, verify the signature, and apply
 * the event idempotently.
 *
 * It is deliberately refused in production. No real card data is accepted and
 * no real money moves.
 */

function headerValue(headers, name) {
  const value = headers?.[name] ?? headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function safeEqualHex(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sign(secret, value) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function validateEvent(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new PaymentProviderError("INVALID_EVENT", "Invalid payment event payload.");
  }

  const statuses = new Set(["SUCCEEDED", "FAILED", "CANCELLED", "EXPIRED"]);
  const event = {
    eventId: String(body.eventId ?? "").trim(),
    eventType: String(body.eventType ?? "payment.updated").trim(),
    paymentId: String(body.paymentId ?? "").trim(),
    invoiceId: body.invoiceId ? String(body.invoiceId).trim() : undefined,
    providerTransactionId: body.providerTransactionId
      ? String(body.providerTransactionId).trim()
      : undefined,
    providerPaymentId: body.providerPaymentId
      ? String(body.providerPaymentId).trim()
      : undefined,
    status: String(body.status ?? "").trim().toUpperCase(),
    amountMinor: body.amountMinor,
    currency: String(body.currency ?? "").trim().toUpperCase(),
    paymentMethod: body.paymentMethod
      ? String(body.paymentMethod).trim().slice(0, 80)
      : undefined,
  };

  if (!event.eventId || event.eventId.length > 200) {
    throw new PaymentProviderError("INVALID_EVENT_ID", "Invalid payment event id.");
  }
  if (!event.paymentId || !/^[a-f0-9]{24}$/i.test(event.paymentId)) {
    throw new PaymentProviderError("INVALID_PAYMENT_ID", "Invalid payment reference.");
  }
  if (!statuses.has(event.status)) {
    throw new PaymentProviderError("INVALID_EVENT_STATUS", "Unsupported payment event status.");
  }
  if (!Number.isSafeInteger(event.amountMinor) || event.amountMinor <= 0) {
    throw new PaymentProviderError("INVALID_EVENT_AMOUNT", "Invalid payment event amount.");
  }
  if (!/^[A-Z]{3}$/.test(event.currency)) {
    throw new PaymentProviderError("INVALID_EVENT_CURRENCY", "Invalid payment event currency.");
  }

  return event;
}

export function createFakePaymentProvider({
  webhookSecret,
  mockTokenSecret = webhookSecret,
  apiBaseUrl,
  frontendUrl,
  environment = "SANDBOX",
} = {}) {
  if (!webhookSecret || webhookSecret.length < 32) {
    throw new Error("PAYMENT_WEBHOOK_SECRET must be at least 32 characters.");
  }
  if (!mockTokenSecret || mockTokenSecret.length < 32) {
    throw new Error("PAYMENT_MOCK_TOKEN_SECRET must be at least 32 characters.");
  }
  if (environment !== "SANDBOX") {
    throw new Error("The FAKE payment provider is sandbox-only.");
  }

  const base = String(apiBaseUrl ?? "http://localhost:5000").replace(/\/+$/, "");
  const frontend = String(frontendUrl ?? "http://localhost:3000").replace(/\/+$/, "");

  function mockToken(paymentId) {
    return sign(mockTokenSecret, `mock-payment:${paymentId}`);
  }

  return {
    name: "FAKE",
    environment,
    supportsRefunds: true,

    async createCheckout({ payment }) {
      const paymentId = String(payment._id ?? payment.id);
      return {
        providerTransactionId: payment.providerTransactionId,
        checkoutUrl: `${base}/api/v1/payments/mock/checkout/${paymentId}?token=${encodeURIComponent(
          mockToken(paymentId),
        )}`,
      };
    },

    verifyMockToken({ paymentId, token }) {
      return safeEqualHex(mockToken(paymentId), String(token ?? ""));
    },

    verifyWebhook({ rawBody, headers }) {
      const signature = headerValue(headers, "x-payment-signature");
      if (!signature || !safeEqualHex(sign(webhookSecret, rawBody), signature)) {
        throw new PaymentProviderError(
          "INVALID_SIGNATURE",
          "The payment webhook signature is invalid.",
        );
      }

      let body;
      try {
        body = JSON.parse(rawBody);
      } catch {
        throw new PaymentProviderError("INVALID_JSON", "Invalid payment webhook payload.");
      }

      return validateEvent(body);
    },

    async getStatus({ payment }) {
      return {
        paymentId: String(payment._id ?? payment.id),
        status: payment.status === "SUCCEEDED" ? "SUCCEEDED" : "PENDING",
      };
    },

    async refund({ payment, amountMinor }) {
      return {
        providerRefundId: `FAKE-REF-${String(payment._id ?? payment.id)}-${amountMinor}-${Date.now()}`,
        status: "SUCCEEDED",
      };
    },

    buildMockEvent({ payment, outcome, amountMinor }) {
      const status =
        outcome === "success"
          ? "SUCCEEDED"
          : outcome === "cancel"
            ? "CANCELLED"
            : "FAILED";
      return {
        eventId: `mock:${String(payment._id ?? payment.id)}:${status}`,
        eventType: "payment.mock",
        paymentId: String(payment._id ?? payment.id),
        status,
        amountMinor: amountMinor ?? payment.amountMinor,
        currency: payment.currency,
        providerTransactionId: payment.providerTransactionId,
        providerPaymentId:
          status === "SUCCEEDED" ? `FAKE-${String(payment._id ?? payment.id)}` : undefined,
        paymentMethod: "MOCK",
      };
    },

    frontendUrl: frontend,
  };
}

export default createFakePaymentProvider;
