import { PaymentRefund } from "../models/payment-refund.js";

export async function createRefund(data, session = null) {
  const [refund] = await PaymentRefund.create([data], { session });
  return refund.toObject();
}

export async function findRefundById(id) {
  return PaymentRefund.findById(id).lean();
}

export async function listRefundsForPayment(paymentId) {
  return PaymentRefund.find({ paymentId }).sort({ createdAt: -1, _id: -1 }).lean();
}

export async function listRefundsForInvoice(invoiceId) {
  return PaymentRefund.find({ invoiceId }).sort({ createdAt: -1, _id: -1 }).lean();
}

export async function markRefundSucceeded({
  id,
  providerRefundId,
  session = null,
}) {
  const query = PaymentRefund.findByIdAndUpdate(
    id,
    {
      $set: {
        status: "SUCCEEDED",
        completedAt: new Date(),
        ...(providerRefundId ? { providerRefundId } : {}),
      },
    },
    { new: true, session },
  );
  return query.lean();
}

export async function markRefundFailed({ id, safeErrorCode, session = null }) {
  const query = PaymentRefund.findByIdAndUpdate(
    id,
    {
      $set: {
        status: "FAILED",
        ...(safeErrorCode ? { safeErrorCode } : {}),
      },
    },
    { new: true, session },
  );
  return query.lean();
}

export const paymentRefundRepository = Object.freeze({
  create: createRefund,
  findById: findRefundById,
  listForPayment: listRefundsForPayment,
  listForInvoice: listRefundsForInvoice,
  markSucceeded: markRefundSucceeded,
  markFailed: markRefundFailed,
});

export default paymentRefundRepository;
