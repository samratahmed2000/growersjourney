import mongoose from "mongoose";

/**
 * The ONLY place in the backend that manages the MongoDB connection.
 *
 * Why it looks like this:
 * - One managed connection is reused by the whole application instead of
 *   opening a new connection per request.
 * - Mongoose wraps the official MongoDB driver, which matches the models
 *   planned in docs/DATABASE.md.
 * - Connection details, the URI, and credentials are never logged. Error
 *   messages stay generic on purpose.
 * - The connection string is passed in rather than read from `config/env.js`.
 *   That keeps the env-validation side effect (which exits the process when
 *   configuration is missing) out of the HTTP layer, so the app can be imported
 *   and tested without a database. `index.js` and `scripts/check-db.js` pass
 *   `env.mongodbUri` explicitly.
 */

/** How long to wait for a usable server before giving up. Keeps startup fast. */
const SERVER_SELECTION_TIMEOUT_MS = 5000;
const CONNECT_TIMEOUT_MS = 10000;

const READY_STATES = [
  "disconnected",
  "connected",
  "connecting",
  "disconnecting",
];

/** Human-readable connection state, e.g. "connected". */
export function getDatabaseState() {
  return READY_STATES[mongoose.connection.readyState] ?? "unknown";
}

/** Name of the database currently in use, or null. Not a secret. */
export function getDatabaseName() {
  return mongoose.connection.name || null;
}

let listenersRegistered = false;

function registerConnectionListeners() {
  if (listenersRegistered) {
    return;
  }
  listenersRegistered = true;

  mongoose.connection.on("disconnected", () => {
    console.warn("[db] MongoDB disconnected. The driver will retry automatically.");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("[db] MongoDB reconnected.");
  });

  mongoose.connection.on("error", (error) => {
    // Only the error type is logged: driver errors can echo connection details.
    console.error(
      `[db] MongoDB connection error (${error?.name ?? "Error"}). Details are intentionally not logged.`,
    );
  });
}

/**
 * Open the shared connection.
 * Throws if MongoDB cannot be reached, so the caller can decide how to fail.
 *
 * @param {string} uri MongoDB connection string (from `env.mongodbUri`).
 */
export async function connectDatabase(uri) {
  if (!uri) {
    throw new Error("connectDatabase() requires a MongoDB connection string");
  }

  registerConnectionListeners();

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
    connectTimeoutMS: CONNECT_TIMEOUT_MS,
  });

  return mongoose.connection;
}

/**
 * Prove the database is actually reachable.
 * Returns true/false instead of throwing, so callers can report status safely.
 */
export async function pingDatabase() {
  if (mongoose.connection.readyState !== 1) {
    return false;
  }

  try {
    const admin = mongoose.connection.db?.admin();
    if (!admin) {
      return false;
    }
    const result = await admin.ping();
    return result?.ok === 1;
  } catch {
    return false;
  }
}

/** Close the shared connection during shutdown. Safe to call more than once. */
export async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) {
    return;
  }
  await mongoose.disconnect();
}
