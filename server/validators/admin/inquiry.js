import { z } from "zod";
import { INQUIRY_STATUSES, INQUIRY_SERVICES } from "../../constants/inquiry.js";
import {
  limitSchema,
  orderSchema,
  pageSchema,
  searchSchema,
} from "./common.js";

export const inquiryListQuerySchema = z.strictObject({
  page: pageSchema,
  limit: limitSchema,
  status: z.enum(INQUIRY_STATUSES).optional(),
  service: z.string().trim().max(80).optional(),
  search: searchSchema,
  sort: z.enum(["createdAt", "updatedAt", "name", "status"]).default("createdAt"),
  order: orderSchema,
});

export const inquiryIdParamsSchema = z.strictObject({
  id: z.string().trim().regex(/^[a-f0-9]{24}$/i, "Invalid inquiry id."),
});

export const updateInquirySchema = z.strictObject({
  status: z.enum(INQUIRY_STATUSES),
});
