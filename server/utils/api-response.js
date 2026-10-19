/**
 * One consistent JSON envelope for every API response, matching docs/API.md
 * section 5.
 *
 * Success:
 *   { "success": true, "data": { ... } }
 *
 * Error:
 *   { "success": false, "error": { "code": "...", "message": "...", "details": [ ... ] } }
 *
 * Routes should use these helpers instead of calling res.json() directly, so
 * the shape stays identical everywhere.
 */

/** Fallback code per status when a caller does not supply one. */
const DEFAULT_ERROR_CODES = {
  400: "BAD_REQUEST",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  429: "RATE_LIMIT_EXCEEDED",
  500: "INTERNAL_ERROR",
  503: "SERVICE_UNAVAILABLE",
};

/** Send a success envelope. */
export function sendSuccess(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

/**
 * Send an error envelope.
 * `details` is only included when it is a non-empty array, and must never
 * contain secrets, stack traces, or raw database output.
 */
export function sendError(res, { status = 500, code, message, details } = {}) {
  const error = {
    code: code ?? DEFAULT_ERROR_CODES[status] ?? "ERROR",
    message: message ?? "Something went wrong.",
  };

  if (Array.isArray(details) && details.length > 0) {
    error.details = details;
  }

  res.status(status).json({ success: false, error });
}
