import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import healthRouter from "./routes/health.js";

/**
 * Express bootstrap.
 *
 * Startup order matters: configuration is validated on import, then the
 * database is connected, and only after that does the server start accepting
 * requests. If MongoDB cannot be reached, the process exits with code 1 rather
 * than serving traffic against a missing database.
 */

const app = express();

// CORS is restricted to the configured frontend origin(s). Credentials are not
// enabled yet, and a wildcard origin must never be combined with credentials.
app.use(cors({ origin: env.frontendUrls }));
app.use(express.json());

// Versioned API routes. Health checks live in ./routes/health.js.
app.use("/api/v1", healthRouter);

app.get("/", (req, res) => {
  res.send("Server is running");
});

// ---------------------------------------------------------------------------
// Connect before listening. Fail fast and clearly if the database is down.
// ---------------------------------------------------------------------------
try {
  await connectDatabase();
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
