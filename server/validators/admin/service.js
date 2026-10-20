import { z } from "zod";
import { SERVICE_ICONS, SERVICE_LIMITS } from "../../constants/service.js";
import {
  limitSchema,
  objectIdSchema,
  orderSchema,
  pageSchema,
  queryBooleanSchema,
  searchSchema,
} from "./common.js";

const textArray = (maxItems, maxLength, label) =>
  z
    .array(
      z
        .string()
        .trim()
        .max(maxLength, `${label} items must be ${maxLength} characters or fewer.`),
    )
    .max(maxItems, `Please use ${maxItems} ${label.toLowerCase()} items or fewer.`)
    .transform((items) => items.filter((item) => item !== ""));

const titleSchema = z
  .string()
  .trim()
  .min(SERVICE_LIMITS.title.min, "Please enter a service title.")
  .max(
    SERVICE_LIMITS.title.max,
    `Title must be ${SERVICE_LIMITS.title.max} characters or fewer.`,
  );

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(SERVICE_LIMITS.slug.min, "Please enter a URL slug.")
  .max(
    SERVICE_LIMITS.slug.max,
    `Slug must be ${SERVICE_LIMITS.slug.max} characters or fewer.`,
  )
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lower-case letters, numbers, and single hyphens only.",
  );

const summarySchema = z
  .string()
  .trim()
  .min(SERVICE_LIMITS.summary.min, "Please enter a short summary.")
  .max(
    SERVICE_LIMITS.summary.max,
    `Summary must be ${SERVICE_LIMITS.summary.max} characters or fewer.`,
  );

const optionalText = (max, label) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

const iconSchema = z.enum(SERVICE_ICONS);
const sortOrderSchema = z.coerce
  .number()
  .int("Sort order must be a whole number.")
  .min(0)
  .max(SERVICE_LIMITS.sortOrder);

const problemsSchema = textArray(SERVICE_LIMITS.listItems, SERVICE_LIMITS.listItemLength, "Problem");
const deliverablesSchema = textArray(SERVICE_LIMITS.listItems, SERVICE_LIMITS.listItemLength, "Deliverable");
const capabilitiesSchema = textArray(SERVICE_LIMITS.listItems, SERVICE_LIMITS.listItemLength, "Capability");
const technologiesSchema = textArray(SERVICE_LIMITS.technologyItems, SERVICE_LIMITS.technologyLength, "Technology");

export const serviceListQuerySchema = z.strictObject({
  page: pageSchema,
  limit: limitSchema,
  search: searchSchema,
  published: queryBooleanSchema.optional(),
  includeArchived: queryBooleanSchema.optional(),
  sort: z.enum(["sortOrder", "title", "createdAt", "updatedAt"]).default("sortOrder"),
  order: orderSchema,
});

export const serviceIdParamsSchema = z.strictObject({
  id: objectIdSchema,
});

export const createServiceSchema = z
  .strictObject({
    slug: slugSchema,
    title: titleSchema,
    summary: summarySchema,
    description: optionalText(SERVICE_LIMITS.description.max, "Description"),
    icon: iconSchema.default("sparkles"),
    audience: optionalText(SERVICE_LIMITS.audience.max, "Audience"),
    problems: problemsSchema.default([]),
    deliverables: deliverablesSchema.default([]),
    capabilities: capabilitiesSchema.default([]),
    technologies: technologiesSchema.default([]),
    isPublished: z.boolean().default(false),
    sortOrder: sortOrderSchema.default(0),
  });

export const updateServiceSchema = z
  .strictObject({
    title: titleSchema.optional(),
    summary: summarySchema.optional(),
    description: optionalText(SERVICE_LIMITS.description.max, "Description"),
    icon: iconSchema.optional(),
    audience: optionalText(SERVICE_LIMITS.audience.max, "Audience"),
    problems: problemsSchema.optional(),
    deliverables: deliverablesSchema.optional(),
    capabilities: capabilitiesSchema.optional(),
    technologies: technologiesSchema.optional(),
    isPublished: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    sortOrder: sortOrderSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  })
  .refine((value) => !(value.isPublished === true && value.isArchived === true), {
    message: "An archived service cannot be published.",
    path: ["isPublished"],
  });
