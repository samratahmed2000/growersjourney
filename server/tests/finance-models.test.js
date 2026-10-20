import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { Invoice } from "../models/invoice.js";
import { Payment } from "../models/payment.js";
import { PaymentEvent } from "../models/payment-event.js";
import { PaymentRefund } from "../models/payment-refund.js";
import {
  serializeInvoiceDetail,
  serializePortalInvoiceDetail,
} from "../utils/serializers.js";

const clientId = new mongoose.Types.ObjectId("64b000000000000000000021");
const projectId = new mongoose.Types.ObjectId("64b000000000000000000022");
const invoiceId = new mongoose.Types.ObjectId("64b000000000000000000023");
const paymentId = new mongoose.Types.ObjectId("64b000000000000000000024");

function validInvoice(overrides = {}) {
  return new Invoice({
    clientId,
    projectId,
    currency: "BDT",
    lineItems: [
      {
        description: "Website development",
        quantityMilli: 1000,
        unitAmountMinor: 250000,
        lineTotalMinor: 250000,
      },
    ],
    subtotalMinor: 250000,
    totalMinor: 250000,
    amountPaidMinor: 0,
    amountRefundedMinor: 0,
    balanceDueMinor: 250000,
    ...overrides,
  });
}

test("invoice model defaults to a draft and enforces date and money rules", async () => {
  const invoice = validInvoice();
  await invoice.validate();
  assert.equal(invoice.status, "DRAFT");
  assert.equal(invoice.collection.collectionName, "invoices");

  const backwards = validInvoice({
    issueDate: new Date("2026-12-01T00:00:00.000Z"),
    dueDate: new Date("2026-11-01T00:00:00.000Z"),
  });
  await assert.rejects(() => backwards.validate(), /due date cannot be before/i);

  const fractional = validInvoice({ totalMinor: 100.5 });
  await assert.rejects(() => fractional.validate(), /whole number/i);

  const overRefunded = validInvoice({
    amountPaidMinor: 1000,
    amountRefundedMinor: 2000,
  });
  await assert.rejects(() => overRefunded.validate(), /cannot exceed paid/i);
});

test("invoice and payment indexes protect identifiers and event delivery", () => {
  const invoiceIndexes = Invoice.schema.indexes();
  const numberIndex = invoiceIndexes.find(([fields]) => fields.invoiceNumber === 1);
  assert.ok(numberIndex);
  assert.equal(numberIndex[1].unique, true);
  assert.equal(numberIndex[1].sparse, true);

  const eventIndexes = PaymentEvent.schema.indexes();
  const eventIndex = eventIndexes.find(
    ([fields]) => fields.provider === 1 && fields.eventId === 1,
  );
  assert.ok(eventIndex);
  assert.equal(eventIndex[1].unique, true);

  const refundIndexes = PaymentRefund.schema.indexes();
  const providerRefundIndex = refundIndexes.find(
    ([fields]) => fields.provider === 1 && fields.providerRefundId === 1,
  );
  assert.ok(providerRefundIndex);
  assert.equal(providerRefundIndex[1].unique, true);
  assert.equal(providerRefundIndex[1].sparse, true);

  const paymentIndexes = Payment.schema.indexes();
  const activeIndex = paymentIndexes.find(
    ([fields, options]) => fields.invoiceId === 1 && options.unique === true,
  );
  assert.ok(activeIndex);
  assert.equal(activeIndex[1].unique, true);
  assert.deepEqual(activeIndex[1].partialFilterExpression, {
    status: { $in: ["INITIATED", "PENDING"] },
  });
});

test("payment model rejects unsafe amounts and unknown providers", async () => {
  const payment = new Payment({
    invoiceId,
    clientId,
    provider: "FAKE",
    amountMinor: 5000,
    currency: "BDT",
    status: "PENDING",
  });
  await payment.validate();
  assert.equal(payment.appliedAmountMinor, 0);
  assert.equal(payment.refundedAmountMinor, 0);

  const fractional = new Payment({
    invoiceId,
    clientId,
    provider: "FAKE",
    amountMinor: 12.5,
    currency: "BDT",
  });
  await assert.rejects(() => fractional.validate(), /whole number/i);

  const unknownProvider = new Payment({
    invoiceId,
    clientId,
    provider: "STRIPE",
    amountMinor: 100,
    currency: "BDT",
  });
  await assert.rejects(() => unknownProvider.validate(), /enum/i);
});

test("portal invoice serialization never exposes internal notes", () => {
  const raw = {
    _id: invoiceId,
    invoiceNumber: "INV-2026-000001",
    clientId,
    projectId,
    status: "ISSUED",
    currency: "BDT",
    lineItems: [
      {
        description: "Website development",
        quantityMilli: 1500,
        unitAmountMinor: 10000,
        lineTotalMinor: 15000,
      },
    ],
    subtotalMinor: 15000,
    discountMinor: 0,
    taxRateBps: 0,
    taxMinor: 0,
    totalMinor: 15000,
    amountPaidMinor: 0,
    amountRefundedMinor: 0,
    issueDate: new Date("2026-10-01T00:00:00.000Z"),
    dueDate: new Date("2030-10-01T00:00:00.000Z"),
    notes: "Client-visible note",
    internalNotes: "Do not show this",
    createdAt: new Date("2026-10-01T00:00:00.000Z"),
    updatedAt: new Date("2026-10-01T00:00:00.000Z"),
  };

  const admin = serializeInvoiceDetail(raw, {
    includeInternal: true,
    paymentsEnabled: true,
  });
  assert.equal(admin.internalNotes, "Do not show this");
  assert.equal(admin.lineItems[0].quantity, "1.5");
  assert.equal(admin.canPay, true);

  const portal = serializePortalInvoiceDetail(raw, { paymentsEnabled: true });
  assert.equal(portal.internalNotes, undefined);
  assert.equal(JSON.stringify(portal).includes("Do not show this"), false);
  assert.equal(portal.notes, "Client-visible note");
});

test("payment event identifiers distinguish the same event id by provider", () => {
  const eventIndex = PaymentEvent.schema
    .indexes()
    .find(([fields]) => fields.provider === 1 && fields.eventId === 1);
  assert.ok(eventIndex);
  assert.equal(eventIndex[1].unique, true);
});
