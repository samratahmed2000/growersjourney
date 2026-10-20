import { z } from "zod";
import {
  PORTFOLIO_LIMITS,
  PORTFOLIO_STATUSES,
} from "../../constants/portfolio.js";
import { normalizeHttpUrl } from "../url.js";
import {
  limitSchema,
  objectIdSchema,
  orderSchema,
  pageSchema,
  queryBooleanSchema,
  searchSchema,
} from "./common.js";

const titleSchema = z
  .string()
  .trim()
  .min(PORTFOLIO_LIMITS.title.min, "Please enter a portfolio title.")
  .max(
    PORTFOLIO_LIMITS.title.max,
    `Title must be ${PORTFOLIO_LIMITS.title.max} characters or fewer.`,
  );

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(PORTFOLIO_LIMITS.slug.min, "Please enter a URL slug.")
  .max(
    PORTFOLIO_LIMITS.slug.max,
    `Slug must be ${PORTFOLIO_LIMITS.slug.max} characters or fewer.`,
  )
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lower-case letters, numbers, and single hyphens only.",
  );

const summarySchema = z
  .string()
  .trim()
  .min(PORTFOLIO_LIMITS.summary.min, "Please enter a short summary.")
  .max(
    PORTFOLIO_LIMITS.summary.max,
    `Summary must be ${PORTFOLIO_LIMITS.summary.max} characters or fewer.`,
  );

const optionalText = (max, label) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

const urlSchema = z
  .string()
  .trim()
  .max(PORTFOLIO_LIMITS.url.max)
  .optional()
  .transform((value) => normalizeHttpUrl(value, PORTFOLIO_LIMITS.url.max))
  .refine((value) => value !== null, {
    message: "Please enter a valid http:// or https:// link.",
  })
  .transform((value) => value ?? undefined);

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

const imageUrlsSchema = z
  .array(
    z
      .string()
      .trim()
      .max(PORTFOLIO_LIMITS.url.max)
      .transform((value) => normalizeHttpUrl(value, PORTFOLIO_LIMITS.url.max))
      .refine((value) => value !== null, {
        message: "Each image must be a valid http:// or https:// link.",
      }),
  )
  .max(PORTFOLIO_LIMITS.imageUrls, "Please use 8 images or fewer.")
  .transform((items) => items.filter((item) => item !== undefined && item !== null));

const technologiesSchema = textArray(PORTFOLIO_LIMITS.technologyItems, PORTFOLIO_LIMITS.technologyLength, "Technology");
const featuresSchema = textArray(PORTFOLIO_LIMITS.featureItems, PORTFOLIO_LIMITS.featureLength, "Feature");
const statusSchema = z.enum(PORTFOLIO_STATUSES);

export const portfolioListQuerySchema = z.strictObject({
  page: pageSchema,
  limit: limitSchema,
  search: searchSchema,
  published: queryBooleanSchema.optional(),
  includeArchived: queryBooleanSchema.optional(),
  featured: queryBooleanSchema.optional(),
  sort: z.enum(["updatedAt", "createdAt", "title", "publishedAt"]).default("updatedAt"),
  order: orderSchema,
});

export const portfolioIdParamsSchema = z.strictObject({
  id: objectIdSchema,
});

export const createPortfolioSchema = z
  .strictObject({
    slug: slugSchema,
    title: titleSchema,
    summary: summarySchema,
    description: optionalText(PORTFOLIO_LIMITS.description.max, "Description"),
    category: optionalText(PORTFOLIO_LIMITS.category.max, "Category"),
    status: statusSchema.default("CONCEPT"),
    technologies: technologiesSchema.default([]),
    features: featuresSchema.default([]),
    thumbnailUrl: urlSchema,
    imageUrls: imageUrlsSchema.default([]),
    liveUrl: urlSchema,
    sourceUrl: urlSchema,
    isFeatured: z.boolean().default(false),
    isPublished: z.boolean().default(false),
    isSample: z.boolean().default(true),
  })
  .refine((value) => !(value.isFeatured && !value.isPublished), {
    message: "A portfolio entry must be published before it can be featured.",
    path: ["isFeatured"],
  });

export const updatePortfolioSchema = z
  .strictObject({
    title: titleSchema.optional(),
    summary: summarySchema.optional(),
    description: optionalText(PORTFOLIO_LIMITS.description.max, "Description"),
    category: optionalText(PORTFOLIO_LIMITS.category.max, "Category"),
    status: statusSchema.optional(),
    technologies: technologiesSchema.optional(),
    features: featuresSchema.optional(),
    thumbnailUrl: urlSchema,
    imageUrls: imageUrlsSchema.optional(),
    liveUrl: urlSchema,
    sourceUrl: urlSchema,
    isFeatured: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    isSample: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });
