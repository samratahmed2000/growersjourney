import mongoose from "mongoose";
import {
  PAYMENT_EVENT_STATUSES,
  PAYMENT_PROVIDERS,
} from "../constants/payment.js";

/**
 * Provider event ledger.
 *
 * The unique provider/eventId pair is the duplicate-delivery guard. Only a
 * safe hash and identifiers are stored; raw provider payloads are not retained.
 */
const paymentEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      enum: PAYMENT_PROVIDERS,
      uppercase: true,
    },
    eventId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    payloadHash: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
    },
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
    status: {
      type: String,
      required: true,
      enum: PAYMENT_EVENT_STATUSES,
      default: "RECEIVED",
    },
    attempts: { type: Number, required: true, min: 0, default: 0 },
    safeErrorCode: {
      type: String,
      trim: true,
      maxlength: 80,
      default: undefined,
    },
    receivedAt: { type: Date, required: true, default: () => new Date() },
    processedAt: { type: Date, default: undefined },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "payment_events",
  },
);

paymentEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
paymentEventSchema.index({ status: 1, receivedAt: 1 });

export const PaymentEvent =
  mongoose.models.PaymentEvent ??
  mongoose.model("PaymentEvent", paymentEventSchema);

export default PaymentEvent;
