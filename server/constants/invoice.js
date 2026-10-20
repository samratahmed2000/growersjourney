/**
 * Invoice constants.
 *
 * Status changes driven by money are system transitions, not arbitrary admin
 * edits. Only ISSUED and VOID are exposed as explicit admin actions; payment
 * and refund verification derive the rest from the verified ledger.
 */

export const INVOICE_STATUSES = Object.freeze([
  "DRAFT",
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "VOID",
]);

export const INITIAL_INVOICE_STATUS = "DRAFT";

/**
 * Manual status transitions. An issued invoice with payments cannot be voided
 * until its net verified payments are zero (refund first).
 */
export const INVOICE_STATUS_TRANSITIONS = Object.freeze({
  DRAFT: Object.freeze(["ISSUED", "VOID"]),
  ISSUED: Object.freeze(["VOID"]),
  PARTIALLY_PAID: Object.freeze([]),
  PAID: Object.freeze([]),
  OVERDUE: Object.freeze(["VOID"]),
  VOID: Object.freeze([]),
});

export const INVOICE_LIMITS = Object.freeze({
  items: Object.freeze({ min: 1, max: 50 }),
  description: Object.freeze({ min: 1, max: 300 }),
  invoiceNumber: Object.freeze({ min: 3, max: 40 }),
  notes: Object.freeze({ max: 2000 }),
  internalNotes: Object.freeze({ max: 2000 }),
  voidReason: Object.freeze({ min: 3, max: 500 }),
  search: Object.freeze({ max: 120 }),
});

/** Fields that may never be supplied by an API caller. */
export const INVOICE_SERVER_ONLY_FIELDS = Object.freeze([
  "subtotalMinor",
  "discountMinor",
  "taxMinor",
  "totalMinor",
  "amountPaidMinor",
  "amountRefundedMinor",
  "balanceDueMinor",
  "overpaidMinor",
  "status",
  "issuedAt",
  "voidedAt",
]);
