/**
 * Errors that are safe to show to a client.
 *
 * Why a custom class:
 * - Only errors we deliberately raise are treated as "operational". Their
 *   message and details are safe to send to the caller.
 * - Anything else (a bug, a driver error, an unexpected throw) falls through to
 *   a generic 500 so internal details are never exposed.
 *
 * Never put secrets, connection strings, stack traces, or raw database output
 * into `message` or `details`.
 */
export class HttpError extends Error {
  /**
   * @param {number} status HTTP status code
   * @param {string} code stable, machine-readable error code, e.g. NOT_FOUND
   * @param {string} message safe, human-readable message
   * @param {Array<object>} [details] optional additional safe context
   */
  constructor(status, code, message, details) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
    /** Marks the error as expected and safe to report to the caller. */
    this.isOperational = true;
  }
}

/** 400 — the caller sent data that failed validation. */
export function badRequest(message, details) {
  return new HttpError(400, "VALIDATION_ERROR", message, details);
}

/** 404 — the requested resource does not exist (or is intentionally concealed). */
export function notFoundError(message = "The requested resource was not found.") {
  return new HttpError(404, "NOT_FOUND", message);
}

/** 413 — the request body is larger than the configured limit. */
export function payloadTooLarge(message = "The request body is too large.") {
  return new HttpError(413, "PAYLOAD_TOO_LARGE", message);
}
