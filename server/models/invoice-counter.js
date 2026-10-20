import mongoose from "mongoose";

/**
 * Atomic invoice-number sequence.
 *
 * The sequence is per prefix/year. Numbers are consumed only when an invoice is
 * issued; a failed issue can leave a gap, which is safer than reusing a number.
 */
const invoiceCounterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    sequence: { type: Number, required: true, min: 0, default: 0 },
  },
  {
    versionKey: false,
    collection: "invoice_counters",
  },
);

export const InvoiceCounter =
  mongoose.models.InvoiceCounter ??
  mongoose.model("InvoiceCounter", invoiceCounterSchema);

export default InvoiceCounter;
