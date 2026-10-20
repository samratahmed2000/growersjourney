import { z } from "zod";
import { ADMIN_PAGINATION, ADMIN_SEARCH_MAX } from "../../constants/admin.js";

/** A Mongo ObjectId in its URL-safe hex form. */
export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{24}$/i, "Please provide a valid record id.");

export const pageSchema = z.coerce
  .number()
  .int("Page must be a whole number.")
  .min(1, "Page must be at least 1.")
  .max(
    ADMIN_PAGINATION.maxPage,
    `Page must be ${ADMIN_PAGINATION.maxPage} or less.`,
  )
  .default(ADMIN_PAGINATION.defaultPage);

export const limitSchema = z.coerce
  .number()
  .int("Limit must be a whole number.")
  .min(1, "Limit must be at least 1.")
  .max(
    ADMIN_PAGINATION.maxLimit,
    `Limit must be ${ADMIN_PAGINATION.maxLimit} or less.`,
  )
  .default(ADMIN_PAGINATION.defaultLimit);

export const searchSchema = z
  .string()
  .trim()
  .max(ADMIN_SEARCH_MAX, `Search must be ${ADMIN_SEARCH_MAX} characters or fewer.`)
  .optional();

export const orderSchema = z.enum(["asc", "desc"]).default("desc");

/** Query-string booleans must be parsed explicitly; `coerce.boolean("false")` is true. */
export const queryBooleanSchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

export function paginationMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

/** Build the sort object from a validated field and direction. */
export function buildSort(sort, order, fallback = "createdAt") {
  return { [sort ?? fallback]: order === "asc" ? 1 : -1, _id: 1 };
}
