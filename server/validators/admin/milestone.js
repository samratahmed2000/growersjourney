import { z } from "zod";
import {
  MILESTONE_LIMITS,
  MILESTONE_STATUSES,
} from "../../constants/milestone.js";
import {
  objectIdSchema,
  optionalDateOnlySchema,
} from "./common.js";

const optionalText = (max, label) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

export const projectMilestoneParamsSchema = z.strictObject({
  id: objectIdSchema,
  milestoneId: objectIdSchema,
});

export const createMilestoneSchema = z.strictObject({
  title: z
    .string()
    .trim()
    .min(MILESTONE_LIMITS.title.min, "Please enter the milestone title.")
    .max(
      MILESTONE_LIMITS.title.max,
      `Milestone titles must be ${MILESTONE_LIMITS.title.max} characters or fewer.`,
    ),
  description: optionalText(
    MILESTONE_LIMITS.description.max,
    "Milestone description",
  ),
  dueDate: optionalDateOnlySchema,
});

export const updateMilestoneSchema = z
  .strictObject({
    title: z
      .string()
      .trim()
      .min(MILESTONE_LIMITS.title.min, "Please enter the milestone title.")
      .max(
        MILESTONE_LIMITS.title.max,
        `Milestone titles must be ${MILESTONE_LIMITS.title.max} characters or fewer.`,
      )
      .optional(),
    description: optionalText(
      MILESTONE_LIMITS.description.max,
      "Milestone description",
    ),
    status: z.enum(MILESTONE_STATUSES).optional(),
    dueDate: optionalDateOnlySchema,
    sortOrder: z
      .number()
      .int("Sort order must be a whole number.")
      .min(
        MILESTONE_LIMITS.sortOrder.min,
        `Sort order must be at least ${MILESTONE_LIMITS.sortOrder.min}.`,
      )
      .max(
        MILESTONE_LIMITS.sortOrder.max,
        `Sort order must be ${MILESTONE_LIMITS.sortOrder.max} or less.`,
      )
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });
