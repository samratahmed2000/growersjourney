import { getAuthTables } from "@better-auth/core/db";
import { admin } from "better-auth/plugins";
import { env } from "../config/env.js";
import {
  connectDatabase,
  disconnectDatabase,
  getMongoDatabase,
} from "../config/database.js";
import { AuditEvent } from "../models/audit-event.js";
import { Client } from "../models/client.js";
import { Inquiry } from "../models/inquiry.js";
import { Invoice } from "../models/invoice.js";
import { InvoiceCounter } from "../models/invoice-counter.js";
import { Milestone } from "../models/milestone.js";
import { Payment } from "../models/payment.js";
import { PaymentEvent } from "../models/payment-event.js";
import { PaymentRefund } from "../models/payment-refund.js";
import { PortfolioProject } from "../models/portfolio-project.js";
import { Project } from "../models/project.js";
import { ProjectUpdate } from "../models/project-update.js";
import { Service } from "../models/service.js";

/**
 * Create any missing indexes declared by the Mongoose models.
 *
 * Why `createIndexes()` instead of `syncIndexes()`:
 * - `createIndexes()` is additive. It creates missing indexes and leaves
 *   existing ones alone.
 * - `syncIndexes()` can drop indexes that are not declared in the current
 *   schema. That is a destructive database operation and must never run as an
 *   automatic deployment step.
 *
 * The unique `(provider, eventId)` index on `payment_events` is load-bearing:
 * webhook idempotency depends on MongoDB rejecting a duplicate event. Run this
 * script once after a fresh deployment, or whenever a model index changes.
 *
 * It prints model/collection and field names only. It never prints the
 * connection string, database credentials, or document contents.
 */
const MODELS = [
  ["AuditEvent", AuditEvent],
  ["Client", Client],
  ["Inquiry", Inquiry],
  ["Invoice", Invoice],
  ["InvoiceCounter", InvoiceCounter],
  ["Milestone", Milestone],
  ["Payment", Payment],
  ["PaymentEvent", PaymentEvent],
  ["PaymentRefund", PaymentRefund],
  ["PortfolioProject", PortfolioProject],
  ["Project", Project],
  ["ProjectUpdate", ProjectUpdate],
  ["Service", Service],
];

let exitCode = 0;

try {
  await connectDatabase(env.mongodbUri);
  console.log("[indexes] MongoDB connected.");

  for (const [name, model] of MODELS) {
    const created = await model.createIndexes();
    // Mongoose 9 resolves createIndexes() without the legacy index array.
    // Fall back to the declared schema indexes so the message stays accurate.
    const ensured = Array.isArray(created)
      ? created.length
      : model.schema.indexes().length;
    console.log(`[indexes] ${name}: ${ensured} index definition(s) ensured.`);
  }

  // Better Auth's MongoDB adapter creates collections on write, but its
  // field-level unique/index metadata is not included in its lazy index setup
  // in better-auth@1.7.11. Ensure those indexes explicitly, using the same
  // field metadata the adapter uses. This is additive and creates no documents.
  const db = getMongoDatabase();
  if (!db) {
    throw new Error("MongoDB connection is not ready");
  }

  const authTables = getAuthTables({ plugins: [admin()] });
  let authIndexCount = 0;

  for (const table of Object.values(authTables)) {
    for (const [fieldName, field] of Object.entries(table.fields)) {
      if (!field.unique && !field.index) continue;

      const column = field.fieldName || fieldName;
      const unique = Boolean(field.unique);
      const name = `${table.modelName}_${column}_${unique ? "uidx" : "idx"}`;

      await db.collection(table.modelName).createIndex(
        { [column]: 1 },
        { name, ...(unique ? { unique: true } : {}) },
      );
      authIndexCount += 1;
    }
  }

  console.log(
    `[indexes] Better Auth: ${authIndexCount} field index definition(s) ensured.`,
  );

  console.log("[indexes] Index creation completed.");
} catch (error) {
  exitCode = 1;
  console.error(
    `[indexes] Could not create indexes (${error?.name ?? "Error"}). ` +
      "Check MONGODB_URI and the database user's permissions. " +
      "Connection details and index values are intentionally not logged.",
  );
} finally {
  try {
    await disconnectDatabase();
  } catch {
    // The original error, if any, is more useful than a shutdown error.
  }
}

process.exitCode = exitCode;
