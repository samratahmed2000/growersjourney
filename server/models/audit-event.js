import mongoose from "mongoose";

/**
 * Append-only audit record for sensitive financial actions.
 *
 * Metadata must be sanitized before it reaches this model. Never store
 * passwords, tokens, provider secrets, full payloads, or card data.
 */
const auditEventSchema = new mongoose.Schema(
  {
    actorUserId: {
      type: String,
      trim: true,
      maxlength: 128,
      default: undefined,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    resourceType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    resourceId: {
      type: String,
      trim: true,
      maxlength: 128,
      default: undefined,
    },
    requestId: {
      type: String,
      trim: true,
      maxlength: 128,
      default: undefined,
    },
    outcome: {
      type: String,
      required: true,
      enum: ["SUCCESS", "FAILURE"],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    createdAt: { type: Date, default: () => new Date() },
  },
  {
    versionKey: false,
    collection: "audit_events",
  },
);

auditEventSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
auditEventSchema.index({ createdAt: -1 });

export const AuditEvent =
  mongoose.models.AuditEvent ?? mongoose.model("AuditEvent", auditEventSchema);

export default AuditEvent;
