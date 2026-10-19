import { rateLimit } from "express-rate-limit";
import { HttpError } from "../utils/http-error.js";

/**
 * Public-endpoint rate limiting.
 *
 * Why a real library instead of a hand-written Map:
 * - It handles the window/header details, IPv6 key normalization, and store
 *   eviction, all of which are easy to get subtly wrong.
 * - `express-rate-limit` refuses to trust a permissive `trust proxy: true`
 *   setting, which is exactly the mistake that makes IP limits bypassable.
 *
 * Why the error goes through `next()`:
 * - Every response in this API uses the same envelope. Raising an `HttpError`
 *   lets the existing error handler produce `429 RATE_LIMIT_EXCEEDED` and log
 *   one short line, exactly like every other failure.
 *
 * `Retry-After` and the `RateLimit` headers are set by the library before the
 * handler runs, so they survive the hand-off to the error handler.
 */

/** 5 submissions per 15 minutes per IP. Generous for a human, hostile to a flood. */
export const INQUIRY_RATE_LIMIT = Object.freeze({
  windowMs: 15 * 60 * 1000,
  limit: 5,
});

/**
 * @param {{ windowMs?: number, limit?: number }} [options]
 *   Overridable so tests can use a tiny window/limit without waiting.
 */
export function createRateLimiter({
  windowMs = INQUIRY_RATE_LIMIT.windowMs,
  limit = INQUIRY_RATE_LIMIT.limit,
} = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler(req, res, next) {
      next(
        new HttpError(
          429,
          "RATE_LIMIT_EXCEEDED",
          "Too many enquiries were submitted from this address. Please wait a few minutes and try again, or email us directly.",
        ),
      );
    },
  });
}

export default createRateLimiter;
