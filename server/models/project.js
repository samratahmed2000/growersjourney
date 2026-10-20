import mongoose from "mongoose";
import {
  INITIAL_PROJECT_STATUS,
  PROJECT_LIMITS,
  PROJECT_STATUSES,
} from "../constants/project.js";

/**
 * Project — contracted client work.
 *
 * Ownership is the project's `clientId`. Portal access is granted only after a
 * Client record is explicitly linked to a Better Auth user, so a project id
 * alone never authorizes access.
 */
const projectLinkSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      minlength: PROJECT_LIMITS.links.labelMin,
      maxlength: PROJECT_LIMITS.links.labelMax,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: PROJECT_LIMITS.links.urlMax,
    },
  },
  { _id: false },
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: PROJECT_LIMITS.name.min,
      maxlength: PROJECT_LIMITS.name.max,
    },
    description: {
      type: String,
      trim: true,
      maxlength: PROJECT_LIMITS.description.max,
      default: undefined,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: PROJECT_STATUSES,
      default: INITIAL_PROJECT_STATUS,
    },
    startDate: { type: Date, default: undefined },
    dueDate: { type: Date, default: undefined },
    completedAt: { type: Date, default: undefined },
    statusChangedAt: { type: Date, default: undefined },
    statusChangedBy: {
      type: String,
      trim: true,
      maxlength: 128,
      default: undefined,
    },
    /** Client-visible external links. No file storage or embedded documents. */
    links: {
      type: [projectLinkSchema],
      default: undefined,
      validate: {
        validator: (value) =>
          value === undefined || value.length <= PROJECT_LIMITS.links.max,
        message: `A project can have at most ${PROJECT_LIMITS.links.max} links.`,
      },
    },
    createdBy: {
      type: String,
      trim: true,
      maxlength: 128,
      default: undefined,
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
    collection: "projects",
  },
);

projectSchema.index({ clientId: 1, status: 1, updatedAt: -1 });
projectSchema.index({ clientId: 1, updatedAt: -1 });
projectSchema.index({ status: 1, updatedAt: -1 });
projectSchema.index({ createdAt: -1 });

projectSchema.pre("validate", function validateDates() {
  if (this.startDate && this.dueDate && this.dueDate < this.startDate) {
    this.invalidate("dueDate", "The due date cannot be before the start date.");
  }
});

export const Project =
  mongoose.models.Project ?? mongoose.model("Project", projectSchema);

export default Project;
