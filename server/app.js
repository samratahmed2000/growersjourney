import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { requestId } from "./middleware/request-id.js";
import { createRequestLogger } from "./middleware/request-logger.js";
import { notFound } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";
import healthRouter from "./routes/health.js";
import createInquiriesRouter from "./routes/inquiries.js";
import createAuthRouter from "./routes/auth.js";

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
 *   3. cors              — explicit origins only
 *   4. Better Auth       — MUST be before express.json(): it reads the raw body
 *   5. json body parser  — with an explicit size limit
 *   6. routes            — health, public inquiries, then protected profile
 *   7. not found         — terminal 404 for unmatched routes
 *   8. error handler     — must be last, and takes four arguments
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
  /**
   * Better Auth instance built by `auth/create-auth.js`. When omitted (some
   * tests), the auth endpoints are not mounted at all: there is no accidental
   * "protected route with no guard" state.
   */
  auth,
} = {}) {
  const app = express();

  // Do not advertise the framework in a response header.
  app.disable("x-powered-by");

  // Must be set before any middleware reads req.ip (the rate limiter does).
  app.set("trust proxy", trustProxy);

  app.use(requestId);
  app.use(createRequestLogger({ enabled: logRequests }));

  // CORS is restricted to the configured frontend origin(s). Credentials are
  // enabled so a browser may send the session cookie on a direct cross-origin
  // call during development. A wildcard origin is never combined with this.
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      exposedHeaders: CORS_EXPOSED_HEADERS,
    }),
  );

  // Better Auth owns /api/auth/* (sign-in, sign-out, get-session). It must be
  // registered before express.json(), because it reads the raw request body.
  // Express 5 uses the named wildcard syntax.
  if (auth) {
    app.all("/api/auth/*splat", toNodeHandler(auth));
  }

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

  // Protected profile/access endpoints. Every request re-validates the session.
  if (auth) {
    app.use("/api/v1", createAuthRouter({ auth }));
  }

  app.get("/", (req, res) => {
    res.send("Server is running");
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
