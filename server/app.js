import express from "express";
import cors from "cors";
import { requestId } from "./middleware/request-id.js";
import { createRequestLogger } from "./middleware/request-logger.js";
import { notFound } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";
import healthRouter from "./routes/health.js";
import createInquiriesRouter from "./routes/inquiries.js";

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
 *   5. routes            — health, then the rate-limited public inquiry route
 *   6. not found         — terminal 404 for unmatched routes
 *   7. error handler     — must be last, and takes four arguments
 */

/** Requests larger than this are rejected with 413 PAYLOAD_TOO_LARGE. */
export const JSON_BODY_LIMIT = "100kb";

/**
 * Response headers the browser is allowed to read on a cross-origin request.
 * `Retry-After` lets the contact form say how long to wait after a 429; without
 * this, CORS hides it and the form can only show a generic message.
 */
export const CORS_EXPOSED_HEADERS = [
  "Retry-After",
  "RateLimit",
  "RateLimit-Policy",
];

export function createApp({
  allowedOrigins = [],
  jsonLimit = JSON_BODY_LIMIT,
  logRequests = true,
  /**
   * Express "trust proxy" setting. Only a hop count (number) or `false` is
   * accepted. A permissive `true` lets any caller forge X-Forwarded-For and
   * rotate its own rate-limit key, so it is deliberately not supported.
   */
  trustProxy = false,
  /** Injectable in tests only. Defaults to the Mongoose repository. */
  inquiryRepository,
  /** Injectable in tests only. Defaults to 5 requests per 15 minutes. */
  inquiryRateLimit,
} = {}) {
  const app = express();

  // Do not advertise the framework in a response header.
  app.disable("x-powered-by");

  // Must be set before any middleware reads req.ip (the rate limiter does).
  app.set("trust proxy", trustProxy);

  app.use(requestId);
  app.use(createRequestLogger({ enabled: logRequests }));

  // CORS is restricted to the configured frontend origin(s). Credentials are not
  // enabled yet, and a wildcard origin must never be combined with credentials.
  app.use(
    cors({
      origin: allowedOrigins,
      exposedHeaders: CORS_EXPOSED_HEADERS,
    }),
  );

  app.use(express.json({ limit: jsonLimit }));

  // Versioned API routes. Health checks live in ./routes/health.js.
  app.use("/api/v1", healthRouter);

  // Public, rate-limited lead capture. Mounted after the parser so the route
  // receives a parsed body, and before the 404 so the path resolves.
  app.use(
    "/api/v1/inquiries",
    createInquiriesRouter({
      repository: inquiryRepository,
      rateLimit: inquiryRateLimit,
    }),
  );

  app.get("/", (req, res) => {
    res.send("Server is running");
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
