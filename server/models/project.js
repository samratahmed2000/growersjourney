import mongoose from "mongoose";
import {
  INITIAL_PROJECT_STATUS,
  PROJECT_LIMITS,
  PROJECT_STATUSES,
} from "../constants/project.js";

/**
 * Project — read-only in Task 07.
 *
 * The model exists now because the dashboard and client details need a real
 * source of project records. Project creation, milestones, memberships, and
 * portal access are deliberately out of scope until a later task.
 */
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
    createdBy: {
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
