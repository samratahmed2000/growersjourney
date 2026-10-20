import { z } from "zod";
import {
  PROJECT_LIMITS,
  PROJECT_STATUSES,
} from "../../constants/project.js";
import { normalizeHttpUrl } from "../url.js";
import {
  limitSchema,
  objectIdSchema,
  optionalDateOnlySchema,
  orderSchema,
  pageSchema,
  searchSchema,
} from "./common.js";

const optionalText = (max, label) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

const projectLinkSchema = z.strictObject({
  label: z
    .string()
    .trim()
    .min(
      PROJECT_LIMITS.links.labelMin,
      "Please enter a link label of at least 2 characters.",
    )
    .max(
      PROJECT_LIMITS.links.labelMax,
      `Link labels must be ${PROJECT_LIMITS.links.labelMax} characters or fewer.`,
    ),
  url: z
    .string()
    .trim()
    .min(1, "Please enter a link URL.")
    .max(PROJECT_LIMITS.links.urlMax)
    .transform((value) => normalizeHttpUrl(value, PROJECT_LIMITS.links.urlMax))
    .refine((value) => value !== null, {
      message: "Please enter a valid http:// or https:// link.",
    }),
});

const projectLinksSchema = z
  .array(projectLinkSchema)
  .max(
    PROJECT_LIMITS.links.max,
    `A project can have at most ${PROJECT_LIMITS.links.max} links.`,
  )
  .optional();

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

export const createProjectSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(PROJECT_LIMITS.name.min, "Please enter the project name.")
    .max(
      PROJECT_LIMITS.name.max,
      `Project names must be ${PROJECT_LIMITS.name.max} characters or fewer.`,
    ),
  description: optionalText(PROJECT_LIMITS.description.max, "Description"),
  clientId: objectIdSchema,
  startDate: optionalDateOnlySchema,
  dueDate: optionalDateOnlySchema,
  links: projectLinksSchema,
});

export const updateProjectSchema = z
  .strictObject({
    name: z
      .string()
      .trim()
      .min(PROJECT_LIMITS.name.min, "Please enter the project name.")
      .max(
        PROJECT_LIMITS.name.max,
        `Project names must be ${PROJECT_LIMITS.name.max} characters or fewer.`,
      )
      .optional(),
    description: optionalText(PROJECT_LIMITS.description.max, "Description"),
    clientId: objectIdSchema.optional(),
    startDate: optionalDateOnlySchema,
    dueDate: optionalDateOnlySchema,
    links: projectLinksSchema,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const updateProjectStatusSchema = z.strictObject({
  status: z.enum(PROJECT_STATUSES),
});
