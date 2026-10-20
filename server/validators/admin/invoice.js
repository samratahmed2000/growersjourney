import { z } from "zod";
import {
  INVOICE_LIMITS,
  INVOICE_STATUSES,
} from "../../constants/invoice.js";
import { MAX_SAFE_AMOUNT_MINOR } from "../../utils/money.js";
import {
  limitSchema,
  objectIdSchema,
  optionalDateOnlySchema,
  orderSchema,
  pageSchema,
} from "./common.js";

const optionalText = (max, label) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

const amountMinorSchema = z
  .number()
  .int("Please enter a whole number of minor units.")
  .min(0, "Amount cannot be negative.")
  .max(MAX_SAFE_AMOUNT_MINOR, "Amount is too large.");

const positiveAmountMinorSchema = z
  .number()
  .int("Please enter a whole number of minor units.")
  .min(1, "Amount must be greater than zero.")
  .max(MAX_SAFE_AMOUNT_MINOR, "Amount is too large.");

/** Accept decimals as strings or numbers, store them as integer thousandths. */
const quantitySchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .pipe(
    z
      .string()
      .regex(
        /^\d+(\.\d{1,3})?$/,
        "Quantity must be a positive number with up to three decimal places.",
      ),
  )
  .transform((value) => Math.round(Number(value) * 1000))
  .refine((value) => Number.isSafeInteger(value) && value > 0, {
    message: "Quantity must be greater than zero.",
  });

const invoiceLineSchema = z
  .strictObject({
    description: z
      .string()
      .trim()
      .min(INVOICE_LIMITS.description.min, "Please enter a line description.")
      .max(
        INVOICE_LIMITS.description.max,
        `Line descriptions must be ${INVOICE_LIMITS.description.max} characters or fewer.`,
      ),
    quantity: quantitySchema,
    unitAmountMinor: amountMinorSchema,
  })
  .transform(({ description, quantity, unitAmountMinor }) => ({
    description,
    quantityMilli: quantity,
    unitAmountMinor,
  }));

const invoiceNumberSchema = z
  .string()
  .trim()
  .min(INVOICE_LIMITS.invoiceNumber.min, "Invoice number is too short.")
  .max(INVOICE_LIMITS.invoiceNumber.max, "Invoice number is too long.")
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9-]*$/,
    "Invoice number may contain letters, numbers, and hyphens only.",
  )
  .transform((value) => value.toUpperCase());

const currencySchema = z
  .string()
  .trim()
  .length(3, "Currency must be a three-letter code.")
  .transform((value) => value.toUpperCase());

export const invoiceParamsSchema = z.strictObject({
  id: objectIdSchema,
});

export const invoiceListQuerySchema = z.strictObject({
  page: pageSchema,
  limit: limitSchema,
  status: z.enum(INVOICE_STATUSES).optional(),
  clientId: objectIdSchema.optional(),
  projectId: objectIdSchema.optional(),
  search: z
    .string()
    .trim()
    .max(INVOICE_LIMITS.search.max, "Search is too long.")
    .optional(),
  from: z.iso.date("Use YYYY-MM-DD for the start date.").optional(),
  to: z.iso.date("Use YYYY-MM-DD for the end date.").optional(),
  sort: z
    .enum(["createdAt", "issueDate", "dueDate", "totalMinor", "invoiceNumber", "status"])
    .default("createdAt"),
  order: orderSchema,
});

export const createInvoiceSchema = z.strictObject({
  clientId: objectIdSchema,
  projectId: objectIdSchema.optional(),
  currency: currencySchema,
  invoiceNumber: invoiceNumberSchema.optional(),
  lineItems: z
    .array(invoiceLineSchema)
    .min(INVOICE_LIMITS.items.min, "Add at least one line item.")
    .max(INVOICE_LIMITS.items.max, "Too many line items."),
  discountMinor: amountMinorSchema.default(0),
  taxRateBps: z
    .number()
    .int("Tax rate must be a whole number of basis points.")
    .min(0)
    .max(10000, "Tax rate cannot exceed 100%.")
    .default(0),
  issueDate: optionalDateOnlySchema,
  dueDate: optionalDateOnlySchema,
  notes: optionalText(INVOICE_LIMITS.notes.max, "Notes"),
  internalNotes: optionalText(INVOICE_LIMITS.internalNotes.max, "Internal notes"),
});

export const updateInvoiceSchema = z.strictObject({
  clientId: objectIdSchema.optional(),
  projectId: objectIdSchema.optional().nullable(),
  currency: currencySchema.optional(),
  invoiceNumber: invoiceNumberSchema.optional().nullable(),
  lineItems: z
    .array(invoiceLineSchema)
    .min(INVOICE_LIMITS.items.min, "Add at least one line item.")
    .max(INVOICE_LIMITS.items.max, "Too many line items.")
    .optional(),
  discountMinor: amountMinorSchema.optional(),
  taxRateBps: z
    .number()
    .int("Tax rate must be a whole number of basis points.")
    .min(0)
    .max(10000, "Tax rate cannot exceed 100%.")
    .optional(),
  issueDate: optionalDateOnlySchema,
  dueDate: optionalDateOnlySchema,
  notes: optionalText(INVOICE_LIMITS.notes.max, "Notes").nullable(),
  internalNotes: optionalText(INVOICE_LIMITS.internalNotes.max, "Internal notes").nullable(),
});

export const voidInvoiceSchema = z.strictObject({
  reason: z
    .string()
    .trim()
    .min(INVOICE_LIMITS.voidReason.min, "Please provide a void reason.")
    .max(INVOICE_LIMITS.voidReason.max, "Void reason is too long."),
});

export { amountMinorSchema, positiveAmountMinorSchema };
