import mongoose from "mongoose";
import {
  PAYMENT_ENVIRONMENTS,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
} from "../constants/payment.js";
import { CURRENCY_EXPONENTS } from "../utils/money.js";

/**
 * Payment attempt.
 *
 * This is a ledger record, not a browser state. It contains provider references
 * and status only; card numbers, CVVs, and provider secrets must never be
 * stored here.
 */
const paymentSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: PAYMENT_PROVIDERS,
      uppercase: true,
    },
    environment: {
      type: String,
      required: true,
      enum: PAYMENT_ENVIRONMENTS,
      default: "SANDBOX",
    },
    providerTransactionId: {
      type: String,
      trim: true,
      maxlength: 120,
      default: undefined,
    },
    providerPaymentId: {
      type: String,
      trim: true,
      maxlength: 160,
      default: undefined,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      maxlength: 120,
      default: undefined,
    },
    amountMinor: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "Payment amount must be a whole number of minor units.",
      },
    },
    appliedAmountMinor: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "Applied amount must be a whole number of minor units.",
      },
    },
    overpaidMinor: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "Overpaid amount must be a whole number of minor units.",
      },
    },
    refundedAmountMinor: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "Refunded amount must be a whole number of minor units.",
      },
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      enum: Object.keys(CURRENCY_EXPONENTS),
      default: "BDT",
    },
    status: {
      type: String,
      required: true,
      enum: PAYMENT_STATUSES,
      default: "INITIATED",
    },
    providerMethod: {
      type: String,
      trim: true,
      maxlength: 80,
      default: undefined,
    },
    initiatedByUserId: {
      type: String,
      trim: true,
      maxlength: 128,
      default: undefined,
    },
    initiatedAt: { type: Date, default: undefined },
    verifiedAt: { type: Date, default: undefined },
    failedAt: { type: Date, default: undefined },
    safeFailureCode: {
      type: String,
      trim: true,
      maxlength: 80,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "payments",
  },
);

paymentSchema.index({ invoiceId: 1, createdAt: -1 });
paymentSchema.index({ clientId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: 1 });
paymentSchema.index({ provider: 1, providerTransactionId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ provider: 1, providerPaymentId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

paymentSchema.pre("validate", function validateRefundTotal() {
  if (this.refundedAmountMinor > this.amountMinor) {
    this.invalidate(
      "refundedAmountMinor",
      "Refunded amount cannot exceed the payment amount.",
    );
  }
});

export const Payment =
  mongoose.models.Payment ?? mongoose.model("Payment", paymentSchema);

export default Payment;
