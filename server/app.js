import express from "express";
import cors from "cors";
import { requestId } from "./middleware/request-id.js";
import { createRequestLogger } from "./middleware/request-logger.js";
import { notFound } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";
import healthRouter from "./routes/health.js";

/**
 * Builds the Express application.
 *
 * Why this is a factory and not a module with side effects:
 * - `server/index.js` keeps the process concerns (env validation, database
 *   connection, listening, shutdown).
 * - This file only wires up HTTP concerns, so tests can import it without a
 *   database, without a fixed port, and without starting a real server.
 * - Options are injected rather than read from `config/env.js`, because that
 *   module exits the process when configuration is missing.
 *
 * Middleware order matters and is deliberate:
 *   1. request id        — so later logs and errors can be correlated
 *   2. request logger    — logs every response, including body-parser failures
 *   3. cors              — reject/allow origins before doing more work
 *   4. json body parser  — with an explicit size limit
 *   5. routes            — application endpoints
 *   6. not found         — terminal 404 for unmatched routes
 *   7. error handler     — must be last, and takes four arguments
 */

/** Requests larger than this are rejected with 413 PAYLOAD_TOO_LARGE. */
export const JSON_BODY_LIMIT = "100kb";

export function createApp({
  allowedOrigins = [],
  jsonLimit = JSON_BODY_LIMIT,
  logRequests = true,
} = {}) {
  const app = express();

  // Do not advertise the framework in a response header.
  app.disable("x-powered-by");

  app.use(requestId);
  app.use(createRequestLogger({ enabled: logRequests }));

  // CORS is restricted to the configured frontend origin(s). Credentials are not
  // enabled yet, and a wildcard origin must never be combined with credentials.
  app.use(cors({ origin: allowedOrigins }));

  app.use(express.json({ limit: jsonLimit }));

  // Versioned API routes. Health checks live in ./routes/health.js.
  app.use("/api/v1", healthRouter);

  app.get("/", (req, res) => {
    res.send("Server is running");
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
