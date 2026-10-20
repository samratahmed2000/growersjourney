import mongoose from "mongoose";
import {
  CLIENT_LIMITS,
  CLIENT_STATUSES,
  INITIAL_CLIENT_STATUS,
} from "../constants/client.js";

/**
 * Client — an agency business record.
 *
 * This is deliberately separate from a Better Auth user. Task 07 does not create
 * portal accounts; a client record may exist without a login, and creating one
 * must never grant access to the site.
 *
 * `primaryEmail` is normalized and uniquely indexed so the admin UI cannot
 * accidentally create two records for the same contact. A person may still
 * submit more than one inquiry — inquiries are intentionally not unique.
 */
const clientSchema = new mongoose.Schema(
  {
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: CLIENT_LIMITS.displayName.min,
      maxlength: CLIENT_LIMITS.displayName.max,
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: CLIENT_LIMITS.companyName.max,
      default: undefined,
    },
    primaryEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: CLIENT_LIMITS.primaryEmail.max,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: CLIENT_LIMITS.phone.max,
      default: undefined,
    },
    status: {
      type: String,
      required: true,
      enum: CLIENT_STATUSES,
      default: INITIAL_CLIENT_STATUS,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: CLIENT_LIMITS.notes.max,
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
    collection: "clients",
  },
);

clientSchema.index({ primaryEmail: 1 }, { unique: true });
clientSchema.index({ displayName: 1 });
clientSchema.index({ status: 1, createdAt: -1 });

export const Client =
  mongoose.models.Client ?? mongoose.model("Client", clientSchema);

export default Client;
