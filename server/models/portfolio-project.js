import mongoose from "mongoose";
import {
  INITIAL_PORTFOLIO_STATUS,
  PORTFOLIO_LIMITS,
  PORTFOLIO_STATUSES,
} from "../constants/portfolio.js";

function boundedStringArray(maxItems, maxLength) {
  return {
    type: [String],
    default: [],
    validate: [
      (value) =>
        value.length <= maxItems &&
        value.every((item) => String(item).length <= maxLength),
      `Please use ${maxItems} items or fewer, each ${maxLength} characters or fewer.`,
    ],
  };
}

/**
 * PortfolioProject — admin-managed portfolio content.
 *
 * `isSample` defaults to true. Real client work must be explicitly marked, and
 * the UI warns that written client approval is required. There are no fields
 * for testimonials, ratings, client logos, or outcome metrics by design.
 */
const portfolioSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: PORTFOLIO_LIMITS.title.min,
      maxlength: PORTFOLIO_LIMITS.title.max,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: PORTFOLIO_LIMITS.slug.min,
      maxlength: PORTFOLIO_LIMITS.slug.max,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      minlength: PORTFOLIO_LIMITS.summary.min,
      maxlength: PORTFOLIO_LIMITS.summary.max,
    },
    description: {
      type: String,
      trim: true,
      maxlength: PORTFOLIO_LIMITS.description.max,
      default: undefined,
    },
    category: {
      type: String,
      trim: true,
      maxlength: PORTFOLIO_LIMITS.category.max,
      default: undefined,
    },
    status: {
      type: String,
      enum: PORTFOLIO_STATUSES,
      default: INITIAL_PORTFOLIO_STATUS,
    },
    technologies: boundedStringArray(
      PORTFOLIO_LIMITS.technologyItems,
      PORTFOLIO_LIMITS.technologyLength,
    ),
    features: boundedStringArray(
      PORTFOLIO_LIMITS.featureItems,
      PORTFOLIO_LIMITS.featureLength,
    ),
    thumbnailUrl: {
      type: String,
      trim: true,
      maxlength: PORTFOLIO_LIMITS.url.max,
      default: undefined,
    },
    imageUrls: {
      type: [String],
      default: [],
      validate: [
        (value) => value.length <= PORTFOLIO_LIMITS.imageUrls,
        `Please use ${PORTFOLIO_LIMITS.imageUrls} images or fewer.`,
      ],
    },
    liveUrl: {
      type: String,
      trim: true,
      maxlength: PORTFOLIO_LIMITS.url.max,
      default: undefined,
    },
    sourceUrl: {
      type: String,
      trim: true,
      maxlength: PORTFOLIO_LIMITS.url.max,
      default: undefined,
    },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: undefined },
    isSample: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
    updatedBy: {
      type: String,
      trim: true,
      maxlength: 128,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "portfolioprojects",
  },
);

portfolioSchema.index({ slug: 1 }, { unique: true });
portfolioSchema.index({ isArchived: 1, isPublished: 1, isFeatured: 1, publishedAt: -1 });
portfolioSchema.index({ category: 1 });

export const PortfolioProject =
  mongoose.models.PortfolioProject ??
  mongoose.model("PortfolioProject", portfolioSchema);

export default PortfolioProject;
