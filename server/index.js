import { env } from "./config/env.js";
import {
  connectDatabase,
  disconnectDatabase,
  getMongoClient,
  getMongoDatabase,
} from "./config/database.js";
import { createApp } from "./app.js";
import { createAuth } from "./auth/create-auth.js";
import { createFinanceRuntime } from "./finance/runtime.js";

/**
 * Process bootstrap.
 *
 * This file owns process-level concerns only: configuration, the database
 * connection, authentication initialization, listening, and shutdown. The HTTP
 * application itself is built by `createApp()` in ./app.js, which keeps it
 * testable without a database.
 *
 * Startup order matters: configuration is validated on import (see
 * config/env.js), then MongoDB is connected, then Better Auth is created against
 * the already-open connection, and only after that does the server accept
 * requests. If any step fails, the process exits with code 1 rather than serving
 * traffic against a half-configured system.
 */

// ---------------------------------------------------------------------------
// Connect before listening. Fail fast and clearly if the database is down.
// ---------------------------------------------------------------------------
try {
  await connectDatabase(env.mongodbUri);
  console.log("[db] MongoDB connected.");
} catch (error) {
  // Only the error type is reported; driver errors can echo connection details.
  console.error(
    `[db] Could not connect to MongoDB (${error?.name ?? "Error"}). ` +
      "Check MONGODB_URI in server/.env and your MongoDB Atlas network access list. " +
      "Connection details are intentionally not logged.",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Better Auth uses the official MongoDB driver adapter against the same
// connection pool. Creating it after the connection means the adapter receives
// a real Db, not a promise.
// ---------------------------------------------------------------------------
let auth;

try {
  const db = getMongoDatabase();

  if (!db) {
    throw new Error("MongoDB connection is not ready");
  }

  auth = createAuth({
    db,
    client: getMongoClient(),
    transaction: env.mongodbTransactions,
    secret: env.betterAuthSecret,
    baseURL: env.betterAuthUrl,
    trustedOrigins: env.frontendUrls,
    useSecureCookies: env.betterAuthUrl.startsWith("https://"),
  });
} catch (error) {
  // Never print the secret or the connection string. The error name is enough
  // for an operator to know this is an auth configuration problem.
  console.error(
    `[auth] Could not initialize authentication (${error?.name ?? "Error"}). ` +
      "Check BETTER_AUTH_SECRET, BETTER_AUTH_URL, and MONGODB_TRANSACTIONS in server/.env.",
  );
  await disconnectDatabase();
  process.exit(1);
}

let finance;

try {
  finance = createFinanceRuntime({ env });
} catch (error) {
  console.error(
    `[finance] Could not initialize invoices and payments (${error?.name ?? "Error"}). ` +
      "Check INVOICE_*, PAYMENTS_*, PAYMENT_PROVIDER, and PAYMENT_WEBHOOK_SECRET in server/.env.",
  );
  await disconnectDatabase();
  process.exit(1);
}

const app = createApp({
  allowedOrigins: env.frontendUrls,
  trustProxy: env.trustProxy,
  securityHsts: env.isProduction,
  auth,
  finance,
});

const server = app.listen(env.port, () => {
  console.log(`server is running at ${env.port}`);
});

// ---------------------------------------------------------------------------
// Graceful shutdown: stop accepting requests, close the database, then exit.
// ---------------------------------------------------------------------------
let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  console.log(`\n[server] ${signal} received. Shutting down gracefully...`);

  // Never hang forever if a client keeps a connection open.
  const watchdog = setTimeout(() => {
    console.error("[server] Shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10000);
  watchdog.unref();

  server.close(async () => {
    try {
      await disconnectDatabase();
      console.log("[db] MongoDB connection closed.");
    } catch {
      console.error("[db] Could not close the MongoDB connection cleanly.");
    }
    clearTimeout(watchdog);
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
