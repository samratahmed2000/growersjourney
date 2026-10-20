import { z } from "zod";
import { PROJECT_STATUSES } from "../../constants/project.js";
import {
  limitSchema,
  objectIdSchema,
  pageSchema,
} from "../admin/common.js";

export const portalProjectListQuerySchema = z.strictObject({
  page: pageSchema,
  limit: limitSchema,
  status: z.enum(PROJECT_STATUSES).optional(),
});

export const portalProjectParamsSchema = z.strictObject({
  id: objectIdSchema,
});

export const portalUpdateListQuerySchema = z.strictObject({
  page: pageSchema,
  limit: limitSchema,
});
