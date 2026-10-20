import { z } from "zod";
import { PROJECT_STATUSES } from "../../constants/project.js";
import {
  limitSchema,
  objectIdSchema,
  orderSchema,
  pageSchema,
  searchSchema,
} from "./common.js";

export const projectListQuerySchema = z.strictObject({
  page: pageSchema,
  limit: limitSchema,
  status: z.enum(PROJECT_STATUSES).optional(),
  clientId: objectIdSchema.optional(),
  search: searchSchema,
  sort: z.enum(["createdAt", "updatedAt", "name", "dueDate"]).default("updatedAt"),
  order: orderSchema,
});

export const projectIdParamsSchema = z.strictObject({
  id: objectIdSchema,
});
