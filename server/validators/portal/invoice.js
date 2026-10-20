import { z } from "zod";
import { INVOICE_STATUSES } from "../../constants/invoice.js";
import { PAYMENT_LIMITS } from "../../constants/payment.js";
import {
  limitSchema,
  objectIdSchema,
  pageSchema,
} from "../admin/common.js";
import { amountMinorSchema } from "../admin/invoice.js";

export const portalInvoiceParamsSchema = z.strictObject({
  id: objectIdSchema,
});

export const portalInvoiceListQuerySchema = z.strictObject({
  page: pageSchema,
  limit: limitSchema,
  status: z.enum(INVOICE_STATUSES).optional(),
});

export const portalPaymentParamsSchema = z.strictObject({
  id: objectIdSchema,
});

export const paymentSessionSchema = z.strictObject({
  amountMinor: amountMinorSchema.optional(),
  // Required so a retried request can be recognized even if the first response
  // was lost. The service still checks the invoice balance and any existing
  // active attempt before creating a new payment.
  idempotencyKey: z
    .string()
    .trim()
    .min(PAYMENT_LIMITS.idempotencyKey.min, "Idempotency key is too short.")
    .max(PAYMENT_LIMITS.idempotencyKey.max, "Idempotency key is too long."),
});
