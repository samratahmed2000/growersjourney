import mongoose from "mongoose";
import {
  PAYMENT_PROVIDERS,
  PAYMENT_REFUND_STATUSES,
} from "../constants/payment.js";

const paymentRefundSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: PAYMENT_PROVIDERS,
      uppercase: true,
    },
    providerRefundId: {
      type: String,
      trim: true,
      maxlength: 160,
      default: undefined,
    },
    amountMinor: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "Refund amount must be a whole number of minor units.",
      },
    },
    status: {
      type: String,
      required: true,
      enum: PAYMENT_REFUND_STATUSES,
      default: "REQUESTED",
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: undefined,
    },
    initiatedBy: {
      type: String,
      trim: true,
      maxlength: 128,
      default: undefined,
    },
    completedAt: { type: Date, default: undefined },
    safeErrorCode: {
      type: String,
      trim: true,
      maxlength: 80,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "payment_refunds",
  },
);

paymentRefundSchema.index(
  { provider: 1, providerRefundId: 1 },
  { unique: true, sparse: true },
);
paymentRefundSchema.index({ paymentId: 1, createdAt: -1 });

export const PaymentRefund =
  mongoose.models.PaymentRefund ??
  mongoose.model("PaymentRefund", paymentRefundSchema);

export default PaymentRefund;
