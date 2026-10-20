import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateInvoiceTotals,
  balanceDueMinor,
  minorAmountToDecimalString,
} from "../utils/money.js";
import { deriveInvoiceStatus, dueDateOverdueCutoff, isInvoicePastDue } from "../utils/invoice-status.js";

test("invoice totals use integer minor units and round once per line", () => {
  const totals = calculateInvoiceTotals({
    items: [
      { description: "Design", quantityMilli: 1500, unitAmountMinor: 10000 },
      { description: "Build", quantityMilli: 1000, unitAmountMinor: 25000 },
    ],
    discountMinor: 1000,
    taxRateBps: 500,
    discountEnabled: true,
    taxEnabled: true,
  });

  assert.equal(totals.lineItems[0].lineTotalMinor, 15000);
  assert.equal(totals.lineItems[1].lineTotalMinor, 25000);
  assert.equal(totals.subtotalMinor, 40000);
  assert.equal(totals.discountMinor, 1000);
  assert.equal(totals.taxMinor, 1950);
  assert.equal(totals.totalMinor, 40950);
});

test("disabled discounts and tax are rejected instead of silently ignored", () => {
  assert.throws(
    () =>
      calculateInvoiceTotals({
        items: [{ description: "Work", quantityMilli: 1000, unitAmountMinor: 100 }],
        discountMinor: 10,
        discountEnabled: false,
      }),
    /Discounts are not enabled/,
  );

  assert.throws(
    () =>
      calculateInvoiceTotals({
        items: [{ description: "Work", quantityMilli: 1000, unitAmountMinor: 100 }],
        taxRateBps: 500,
        taxEnabled: false,
      }),
    /Tax is not enabled/,
  );
});

test("money formatting and balances stay exact", () => {
  assert.equal(minorAmountToDecimalString(12345, "BDT"), "123.45");
  assert.equal(
    balanceDueMinor({
      totalMinor: 10000,
      amountPaidMinor: 4000,
      amountRefundedMinor: 1000,
    }),
    7000,
  );
});

test("invoice status is derived from verified money and the due date", () => {
  const now = new Date("2026-10-20T12:00:00.000Z");
  const dueDate = new Date("2026-10-31T00:00:00.000Z");

  assert.equal(
    deriveInvoiceStatus({
      currentStatus: "ISSUED",
      totalMinor: 10000,
      amountPaidMinor: 0,
      dueDate,
      now,
      timeZone: "Asia/Dhaka",
    }),
    "ISSUED",
  );
  assert.equal(
    deriveInvoiceStatus({
      currentStatus: "ISSUED",
      totalMinor: 10000,
      amountPaidMinor: 5000,
      dueDate,
      now,
      timeZone: "Asia/Dhaka",
    }),
    "PARTIALLY_PAID",
  );
  assert.equal(
    deriveInvoiceStatus({
      currentStatus: "ISSUED",
      totalMinor: 10000,
      amountPaidMinor: 10000,
      dueDate,
      now,
      timeZone: "Asia/Dhaka",
    }),
    "PAID",
  );
  assert.equal(
    deriveInvoiceStatus({
      currentStatus: "ISSUED",
      totalMinor: 10000,
      amountPaidMinor: 0,
      dueDate: new Date("2026-10-01T00:00:00.000Z"),
      now,
      timeZone: "Asia/Dhaka",
    }),
    "OVERDUE",
  );
});

test("a void or draft invoice is never promoted by a due date", () => {
  assert.equal(
    deriveInvoiceStatus({
      currentStatus: "VOID",
      totalMinor: 10000,
      amountPaidMinor: 10000,
      dueDate: new Date("2026-01-01T00:00:00.000Z"),
      now: new Date("2026-10-20T12:00:00.000Z"),
      timeZone: "Asia/Dhaka",
    }),
    "VOID",
  );

  assert.equal(
    isInvoicePastDue({
      dueDate: new Date("2026-10-19T00:00:00.000Z"),
      now: new Date("2026-10-20T12:00:00.000Z"),
      timeZone: "Asia/Dhaka",
      graceDays: 1,
    }),
    false,
  );
});

test("the overdue list cutoff matches the effective status boundary", () => {
  const now = new Date("2026-10-20T12:00:00.000Z");

  assert.equal(
    dueDateOverdueCutoff({ now, timeZone: "Asia/Dhaka", graceDays: 0 }),
    "2026-10-20",
  );
  assert.equal(
    dueDateOverdueCutoff({ now, timeZone: "Asia/Dhaka", graceDays: 2 }),
    "2026-10-18",
  );
  assert.equal(
    deriveInvoiceStatus({
      currentStatus: "ISSUED",
      totalMinor: 100,
      dueDate: new Date("2026-10-18T00:00:00.000Z"),
      now,
      timeZone: "Asia/Dhaka",
      graceDays: 2,
    }),
    "ISSUED",
  );
  assert.equal(
    deriveInvoiceStatus({
      currentStatus: "ISSUED",
      totalMinor: 100,
      dueDate: new Date("2026-10-17T00:00:00.000Z"),
      now,
      timeZone: "Asia/Dhaka",
      graceDays: 2,
    }),
    "OVERDUE",
  );
});
