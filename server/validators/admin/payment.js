import { z } from "zod";
import {
  PAYMENT_LIMITS,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
} from "../../constants/payment.js";
import { MAX_SAFE_AMOUNT_MINOR } from "../../utils/money.js";
import {
  limitSchema,
  objectIdSchema,
  pageSchema,
} from "./common.js";

export const paymentParamsSchema = z.strictObject({
  id: objectIdSchema,
});

export const paymentListQuerySchema = z.strictObject({
  page: pageSchema,
  limit: limitSchema,
  status: z.enum(PAYMENT_STATUSES).optional(),
  provider: z.enum(PAYMENT_PROVIDERS).optional(),
  invoiceId: objectIdSchema.optional(),
  clientId: objectIdSchema.optional(),
});

export const paymentRefundSchema = z.strictObject({
  amountMinor: z
    .number()
    .int("Refund amount must be a whole number of minor units.")
    .min(1, "Refund amount must be greater than zero.")
    .max(MAX_SAFE_AMOUNT_MINOR, "Refund amount is too large."),
  reason: z
    .string()
    .trim()
    .min(PAYMENT_LIMITS.refundReason.min, "Please provide a refund reason.")
    .max(PAYMENT_LIMITS.refundReason.max, "Refund reason is too long."),
});
