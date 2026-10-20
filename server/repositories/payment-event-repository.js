import { PaymentEvent } from "../models/payment-event.js";

export async function findByProviderEventId({ provider, eventId }) {
  return PaymentEvent.findOne({ provider, eventId }).lean();
}

export async function createPaymentEvent(data) {
  return PaymentEvent.create(data);
}

export async function markProcessed({ id, session = null }) {
  return PaymentEvent.findByIdAndUpdate(
    id,
    { $set: { status: "PROCESSED", processedAt: new Date() } },
    { new: true, session },
  ).lean();
}

export async function markIgnored({ id, safeErrorCode, session = null }) {
  return PaymentEvent.findByIdAndUpdate(
    id,
    {
      $set: {
        status: "IGNORED",
        processedAt: new Date(),
        ...(safeErrorCode ? { safeErrorCode } : {}),
      },
    },
    { new: true, session },
  ).lean();
}

export async function markFailed({ id, safeErrorCode, session = null }) {
  return PaymentEvent.findByIdAndUpdate(
    id,
    {
      $inc: { attempts: 1 },
      $set: {
        status: "FAILED",
        ...(safeErrorCode ? { safeErrorCode } : {}),
      },
    },
    { new: true, session },
  ).lean();
}

export const paymentEventRepository = Object.freeze({
  findByProviderEventId,
  create: createPaymentEvent,
  markProcessed,
  markIgnored,
  markFailed,
});

export default paymentEventRepository;
