/**
 * Payment constants.
 *
 * A payment attempt is intentionally separate from an invoice status. Only a
 * provider-verified event may move an attempt to SUCCEEDED.
 */

export const PAYMENT_STATUSES = Object.freeze([
  "INITIATED",
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
]);

export const PAYMENT_TERMINAL_STATUSES = Object.freeze([
  "FAILED",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
]);

export const PAYMENT_EVENT_STATUSES = Object.freeze([
  "RECEIVED",
  "PROCESSED",
  "IGNORED",
  "FAILED",
]);

export const PAYMENT_REFUND_STATUSES = Object.freeze([
  "REQUESTED",
  "PENDING",
  "SUCCEEDED",
  "FAILED",
]);

export const PAYMENT_PROVIDERS = Object.freeze(["FAKE"]);

export const PAYMENT_ENVIRONMENTS = Object.freeze(["SANDBOX", "LIVE"]);

export const PAYMENT_LIMITS = Object.freeze({
  amountMinor: Object.freeze({
    min: 1,
    max: 10_000_000_000_000,
  }),
  idempotencyKey: Object.freeze({ min: 8, max: 120 }),
  refundReason: Object.freeze({ min: 3, max: 500 }),
});

export const DEFAULT_PAYMENT_CURRENCY = "BDT";
