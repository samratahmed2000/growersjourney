import { getRequestPath } from "../utils/request-path.js";

/**
 * One structured log line per completed request:
 *
 *   [req] 8f14e45f-... GET /api/v1/health 200 3.2ms
 *
 * Safety rules (deliberate, do not relax):
 * - Log the full path only. The query string is excluded because it can carry
 *   tokens, email addresses, or other personal data.
 * - Never log the request body, headers, cookies, or authorization values.
 * - Never log the response body.
 *
 * `enabled: false` keeps test output readable.
 */
export function createRequestLogger({ enabled = true } = {}) {
  if (!enabled) {
    return function noopRequestLogger(req, res, next) {
      next();
    };
  }

  return function requestLogger(req, res, next) {
    const startedAt = process.hrtime.bigint();

    // Resolved now, before routing starts: inside a mounted router `req.path`
    // is relative (`/health`), and the "finish" event can fire before Express
    // restores the prefix.
    const path = getRequestPath(req);

    // "finish" fires once the response has been handed to the client, so the
    // status code and total duration are both known.
    res.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

      console.log(
        `[req] ${req.id ?? "-"} ${req.method} ${path} ${res.statusCode} ${durationMs.toFixed(1)}ms`,
      );
    });

    next();
  };
}

export default createRequestLogger;
