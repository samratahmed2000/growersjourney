import mongoose from "mongoose";
import {
  INITIAL_PROJECT_UPDATE_VISIBILITY,
  PROJECT_UPDATE_LIMITS,
  PROJECT_UPDATE_VISIBILITIES,
} from "../constants/project-update.js";

/**
 * ProjectUpdate — a progress note.
 *
 * INTERNAL is the default so a careless write cannot disclose information to a
 * client. Portal queries filter `visibility: "CLIENT"` in the database query.
 */
const projectUpdateSchema = new mongoose.Schema(
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
      minlength: PROJECT_UPDATE_LIMITS.title.min,
      maxlength: PROJECT_UPDATE_LIMITS.title.max,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: PROJECT_UPDATE_LIMITS.body.min,
      maxlength: PROJECT_UPDATE_LIMITS.body.max,
    },
    visibility: {
      type: String,
      required: true,
      enum: PROJECT_UPDATE_VISIBILITIES,
      default: INITIAL_PROJECT_UPDATE_VISIBILITY,
    },
    authorId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
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
    collection: "projectupdates",
  },
);

projectUpdateSchema.index({ projectId: 1, visibility: 1, createdAt: -1 });
projectUpdateSchema.index({ projectId: 1, createdAt: -1 });

export const ProjectUpdate =
  mongoose.models.ProjectUpdate ??
  mongoose.model("ProjectUpdate", projectUpdateSchema);

export default ProjectUpdate;
