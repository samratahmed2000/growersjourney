import mongoose from "mongoose";
import {
  INITIAL_MILESTONE_STATUS,
  MILESTONE_LIMITS,
  MILESTONE_STATUSES,
} from "../constants/milestone.js";

/**
 * Milestone — a bounded delivery checkpoint inside a project.
 *
 * The parent project is the ownership boundary. Every HTTP operation verifies
 * the project first and then queries the milestone by both ids.
 */
const milestoneSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: MILESTONE_LIMITS.title.min,
      maxlength: MILESTONE_LIMITS.title.max,
    },
    description: {
      type: String,
      trim: true,
      maxlength: MILESTONE_LIMITS.description.max,
      default: undefined,
    },
    status: {
      type: String,
      required: true,
      enum: MILESTONE_STATUSES,
      default: INITIAL_MILESTONE_STATUS,
    },
    dueDate: { type: Date, default: undefined },
    completedAt: { type: Date, default: undefined },
    sortOrder: {
      type: Number,
      min: MILESTONE_LIMITS.sortOrder.min,
      max: MILESTONE_LIMITS.sortOrder.max,
      default: 0,
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
    collection: "milestones",
  },
);

milestoneSchema.index({ projectId: 1, sortOrder: 1 });
milestoneSchema.index({ projectId: 1, dueDate: 1 });
milestoneSchema.index({ projectId: 1, status: 1 });

/**
 * `completedAt` is derived from status. Callers must never set it directly.
 */
milestoneSchema.pre("validate", function deriveCompletionTimestamp() {
  if (this.status === "COMPLETED" && !this.completedAt) {
    this.completedAt = new Date();
  }

  if (this.status !== "COMPLETED" && this.completedAt) {
    this.completedAt = undefined;
  }
});

export const Milestone =
  mongoose.models.Milestone ?? mongoose.model("Milestone", milestoneSchema);

export default Milestone;
