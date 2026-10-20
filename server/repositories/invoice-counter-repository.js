import { InvoiceCounter } from "../models/invoice-counter.js";

/**
 * Atomically reserve the next invoice number in a prefix/year sequence.
 */
export async function nextInvoiceSequence({ prefix, year, session = null }) {
  const key = `invoice:${prefix}:${year}`;
  const query = InvoiceCounter.findOneAndUpdate(
    { _id: key },
    { $inc: { sequence: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  if (session) query.session(session);
  const counter = await query.lean();
  return counter.sequence;
}

export const invoiceCounterRepository = Object.freeze({
  next: nextInvoiceSequence,
});

export default invoiceCounterRepository;
