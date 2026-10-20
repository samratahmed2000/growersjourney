import { z } from "zod";
import {
  CLIENT_LIMITS,
  CLIENT_STATUSES,
} from "../../constants/client.js";
import {
  limitSchema,
  objectIdSchema,
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

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(CLIENT_LIMITS.primaryEmail.max, "Please use a shorter email address.")
  .pipe(z.email({ error: "Please enter a valid email address." }));

export const clientListQuerySchema = z.strictObject({
  page: pageSchema,
  limit: limitSchema,
  status: z.enum(CLIENT_STATUSES).optional(),
  search: searchSchema,
  sort: z.enum(["createdAt", "updatedAt", "displayName", "companyName"]).default("createdAt"),
  order: orderSchema,
});

export const clientIdParamsSchema = z.strictObject({
  id: objectIdSchema,
});

export const createClientSchema = z.strictObject({
  displayName: z
    .string()
    .trim()
    .min(CLIENT_LIMITS.displayName.min, "Please enter the client name.")
    .max(
      CLIENT_LIMITS.displayName.max,
      `Name must be ${CLIENT_LIMITS.displayName.max} characters or fewer.`,
    ),
  companyName: optionalText(CLIENT_LIMITS.companyName.max, "Company name"),
  primaryEmail: emailSchema,
  phone: optionalText(CLIENT_LIMITS.phone.max, "Phone"),
  status: z.enum(CLIENT_STATUSES).default("ACTIVE"),
  notes: optionalText(CLIENT_LIMITS.notes.max, "Notes"),
});

export const updateClientSchema = z
  .strictObject({
    displayName: z
      .string()
      .trim()
      .min(CLIENT_LIMITS.displayName.min, "Please enter the client name.")
      .max(
        CLIENT_LIMITS.displayName.max,
        `Name must be ${CLIENT_LIMITS.displayName.max} characters or fewer.`,
      )
      .optional(),
    companyName: optionalText(CLIENT_LIMITS.companyName.max, "Company name"),
    primaryEmail: emailSchema.optional(),
    phone: optionalText(CLIENT_LIMITS.phone.max, "Phone"),
    status: z.enum(CLIENT_STATUSES).optional(),
    notes: optionalText(CLIENT_LIMITS.notes.max, "Notes"),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const portalAccessSchema = z.strictObject({
  email: z.union([emailSchema, z.null()]),
});
