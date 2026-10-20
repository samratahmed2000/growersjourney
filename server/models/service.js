import mongoose from "mongoose";
import { SERVICE_ICONS, SERVICE_LIMITS } from "../constants/service.js";

function boundedStringArray(maxItems, maxLength) {
  return {
    type: [String],
    default: [],
    validate: [
      {
        validator: (value) => value.length <= maxItems,
        message: `Please use ${maxItems} items or fewer.`,
      },
      {
        validator: (value) =>
          value.every((item) => String(item).length <= maxLength),
        message: `Each item must be ${maxLength} characters or fewer.`,
      },
    ],
  };
}

/**
 * Service content managed by an administrator.
 *
 * The slug is immutable after creation because it is an anchor id, a future
 * public URL, and the value the contact form sends. Changing it silently would
 * break old links and existing inquiry records.
 */
const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: SERVICE_LIMITS.title.min,
      maxlength: SERVICE_LIMITS.title.max,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: SERVICE_LIMITS.slug.min,
      maxlength: SERVICE_LIMITS.slug.max,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      minlength: SERVICE_LIMITS.summary.min,
      maxlength: SERVICE_LIMITS.summary.max,
    },
    description: {
      type: String,
      trim: true,
      maxlength: SERVICE_LIMITS.description.max,
      default: undefined,
    },
    icon: {
      type: String,
      enum: SERVICE_ICONS,
      default: "sparkles",
    },
    audience: {
      type: String,
      trim: true,
      maxlength: SERVICE_LIMITS.audience.max,
      default: undefined,
    },
    problems: boundedStringArray(
      SERVICE_LIMITS.listItems,
      SERVICE_LIMITS.listItemLength,
    ),
    deliverables: boundedStringArray(
      SERVICE_LIMITS.listItems,
      SERVICE_LIMITS.listItemLength,
    ),
    capabilities: boundedStringArray(
      SERVICE_LIMITS.listItems,
      SERVICE_LIMITS.listItemLength,
    ),
    technologies: boundedStringArray(
      SERVICE_LIMITS.technologyItems,
      SERVICE_LIMITS.technologyLength,
    ),
    isPublished: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
      max: SERVICE_LIMITS.sortOrder,
    },
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
    collection: "services",
  },
);

serviceSchema.index({ slug: 1 }, { unique: true });
serviceSchema.index({ isArchived: 1, isPublished: 1, sortOrder: 1 });

export const Service =
  mongoose.models.Service ?? mongoose.model("Service", serviceSchema);

export default Service;
