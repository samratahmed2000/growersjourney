import mongoose from "mongoose";
import {
  INITIAL_INVOICE_STATUS,
  INVOICE_LIMITS,
  INVOICE_STATUSES,
} from "../constants/invoice.js";
import { CURRENCY_EXPONENTS } from "../utils/money.js";

const lineItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: INVOICE_LIMITS.description.min,
      maxlength: INVOICE_LIMITS.description.max,
    },
    /** Quantity in thousandths: 1.5 is stored as 1500. */
    quantityMilli: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "Quantity must be a whole number of thousandths.",
      },
    },
    unitAmountMinor: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "Unit amount must be a whole number of minor units.",
      },
    },
    lineTotalMinor: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "Line total must be a whole number of minor units.",
      },
    },
  },
  { _id: false },
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: INVOICE_LIMITS.invoiceNumber.max,
      default: undefined,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: undefined,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: INVOICE_STATUSES,
      default: INITIAL_INVOICE_STATUS,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      enum: Object.keys(CURRENCY_EXPONENTS),
      default: "BDT",
    },
    lineItems: {
      type: [lineItemSchema],
      required: true,
      validate: {
        validator: (value) =>
          Array.isArray(value) &&
          value.length >= INVOICE_LIMITS.items.min &&
          value.length <= INVOICE_LIMITS.items.max,
        message: "An invoice needs between 1 and 50 line items.",
      },
    },
    subtotalMinor: { type: Number, required: true, min: 0 },
    discountMinor: { type: Number, required: true, min: 0, default: 0 },
    taxRateBps: { type: Number, required: true, min: 0, max: 10000, default: 0 },
    taxMinor: { type: Number, required: true, min: 0, default: 0 },
    totalMinor: { type: Number, required: true, min: 0 },
    amountPaidMinor: { type: Number, required: true, min: 0, default: 0 },
    amountRefundedMinor: { type: Number, required: true, min: 0, default: 0 },
    balanceDueMinor: { type: Number, required: true, min: 0, default: 0 },
    overpaidMinor: { type: Number, required: true, min: 0, default: 0 },
    issueDate: { type: Date, default: undefined },
    dueDate: { type: Date, default: undefined },
    issuedAt: { type: Date, default: undefined },
    voidedAt: { type: Date, default: undefined },
    voidReason: {
      type: String,
      trim: true,
      maxlength: INVOICE_LIMITS.voidReason.max,
      default: undefined,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: INVOICE_LIMITS.notes.max,
      default: undefined,
    },
    internalNotes: {
      type: String,
      trim: true,
      maxlength: INVOICE_LIMITS.internalNotes.max,
      default: undefined,
    },
    createdBy: {
      type: String,
      trim: true,
      maxlength: 128,
      default: undefined,
    },
    updatedBy: {
      type: String,
      trim: true,
      maxlength: 128,
      default: undefined,
    },
    issuedBy: {
      type: String,
      trim: true,
      maxlength: 128,
      default: undefined,
    },
    voidedBy: {
      type: String,
      trim: true,
      maxlength: 128,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "invoices",
  },
);

invoiceSchema.index({ invoiceNumber: 1 }, { unique: true, sparse: true });
invoiceSchema.index({ clientId: 1, createdAt: -1 });
invoiceSchema.index({ clientId: 1, status: 1, createdAt: -1 });
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ projectId: 1, createdAt: -1 });

invoiceSchema.pre("validate", function validateInvoice() {
  const integerFields = [
    "subtotalMinor",
    "discountMinor",
    "taxRateBps",
    "taxMinor",
    "totalMinor",
    "amountPaidMinor",
    "amountRefundedMinor",
    "balanceDueMinor",
    "overpaidMinor",
  ];

  for (const field of integerFields) {
    if (this[field] !== undefined && !Number.isSafeInteger(this[field])) {
      this.invalidate(field, `${field} must be a whole number.`);
    }
  }

  if (this.issueDate && this.dueDate && this.dueDate < this.issueDate) {
    this.invalidate("dueDate", "The due date cannot be before the issue date.");
  }

  if (this.amountRefundedMinor > this.amountPaidMinor) {
    this.invalidate("amountRefundedMinor", "Refunded amount cannot exceed paid amount.");
  }
});

export const Invoice =
  mongoose.models.Invoice ?? mongoose.model("Invoice", invoiceSchema);

export default Invoice;
