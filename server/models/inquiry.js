import mongoose from "mongoose";
import {
  INITIAL_INQUIRY_STATUS,
  INQUIRY_LIMITS,
  INQUIRY_SERVICES,
  INQUIRY_STATUSES,
} from "../constants/inquiry.js";

/**
 * Inquiry — one contact-form submission.
 *
 * Design notes:
 * - Every field the public may set is bounded here as well as in the Zod
 *   validator. The validator is the user-facing gate; this is the last line of
 *   defence if a future route forgets to validate.
 * - `status` defaults to NEW and is never taken from a request body. Only
 *   staff tooling (not built yet) may move an inquiry through the pipeline.
 * - Optional text fields are stored as absent rather than as empty strings, so
 *   "did the visitor answer this?" stays unambiguous.
 * - No unique index on `email`: one person may legitimately enquire more than
 *   once, and a duplicate-key error would be a confusing 500 for a visitor.
 * - `notes`, `assignedTo`, and `convertedClientId` are intentionally absent.
 *   They belong to the admin phase, not to the public endpoint.
 */

/** Empty or whitespace-only optional values are treated as "not provided". */
function optionalString(maxLength) {
  return {
    type: String,
    trim: true,
    maxlength: maxLength,
    default: undefined,
    set(value) {
      if (typeof value !== "string") {
        return value;
      }
      return value.trim() === "" ? undefined : value;
    },
  };
}

const inquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: INQUIRY_LIMITS.name.min,
      maxlength: INQUIRY_LIMITS.name.max,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: INQUIRY_LIMITS.email.max,
    },
    company: optionalString(INQUIRY_LIMITS.company.max),
    service: {
      type: String,
      required: true,
      trim: true,
      enum: INQUIRY_SERVICES,
    },
    projectDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: INQUIRY_LIMITS.projectDescription.min,
      maxlength: INQUIRY_LIMITS.projectDescription.max,
    },
    budget: optionalString(INQUIRY_LIMITS.budget.max),
    timeline: optionalString(INQUIRY_LIMITS.timeline.max),
    referenceUrl: optionalString(INQUIRY_LIMITS.referenceUrl.max),
    status: {
      type: String,
      required: true,
      enum: INQUIRY_STATUSES,
      default: INITIAL_INQUIRY_STATUS,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "inquiries",
  },
);

// Supports the future admin list: filter by status, newest first.
inquirySchema.index({ status: 1, createdAt: -1 });

export const Inquiry =
  mongoose.models.Inquiry ?? mongoose.model("Inquiry", inquirySchema);

export default Inquiry;
