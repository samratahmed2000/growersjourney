import { z } from "zod";
import {
  INITIAL_PROJECT_UPDATE_VISIBILITY,
  PROJECT_UPDATE_LIMITS,
  PROJECT_UPDATE_VISIBILITIES,
} from "../../constants/project-update.js";
import {
  limitSchema,
  objectIdSchema,
  pageSchema,
} from "./common.js";

export const projectUpdateParamsSchema = z.strictObject({
  id: objectIdSchema,
  updateId: objectIdSchema,
});

export const projectUpdateListQuerySchema = z.strictObject({
  page: pageSchema,
  limit: limitSchema,
});

export const createProjectUpdateSchema = z.strictObject({
  title: z
    .string()
    .trim()
    .min(PROJECT_UPDATE_LIMITS.title.min, "Please enter an update title.")
    .max(
      PROJECT_UPDATE_LIMITS.title.max,
      `Update titles must be ${PROJECT_UPDATE_LIMITS.title.max} characters or fewer.`,
    ),
  body: z
    .string()
    .trim()
    .min(PROJECT_UPDATE_LIMITS.body.min, "Please enter the update text.")
    .max(
      PROJECT_UPDATE_LIMITS.body.max,
      `Update text must be ${PROJECT_UPDATE_LIMITS.body.max} characters or fewer.`,
    ),
  visibility: z
    .enum(PROJECT_UPDATE_VISIBILITIES)
    .default(INITIAL_PROJECT_UPDATE_VISIBILITY),
});

export const updateProjectUpdateSchema = z
  .strictObject({
    title: z
      .string()
      .trim()
      .min(PROJECT_UPDATE_LIMITS.title.min, "Please enter an update title.")
      .max(
        PROJECT_UPDATE_LIMITS.title.max,
        `Update titles must be ${PROJECT_UPDATE_LIMITS.title.max} characters or fewer.`,
      )
      .optional(),
    body: z
      .string()
      .trim()
      .min(PROJECT_UPDATE_LIMITS.body.min, "Please enter the update text.")
      .max(
        PROJECT_UPDATE_LIMITS.body.max,
        `Update text must be ${PROJECT_UPDATE_LIMITS.body.max} characters or fewer.`,
      )
      .optional(),
    visibility: z.enum(PROJECT_UPDATE_VISIBILITIES).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });
