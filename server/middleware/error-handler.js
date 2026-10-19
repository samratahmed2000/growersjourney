import { HttpError } from "../utils/http-error.js";
import { sendError } from "../utils/api-response.js";
import { getRequestPath } from "../utils/request-path.js";
import { redactText } from "../utils/redact.js";

/**
 * Centralized error handler. MUST be the last middleware registered, and MUST
 * keep all four parameters so Express recognises it as an error handler.
 *
 * Responsibilities:
 * - Translate known failures into the standard error envelope with the right
 *   status code and a stable error code.
 * - Never leak internal details: unexpected errors become a generic 500. No
 *   stack trace is ever sent to a client, in any environment.
 * - Log the useful diagnostic information server-side, with the request id.
 * - Redact error text before logging it: a message coming from a driver or an
 *   SDK can contain a connection string, a token, or a key.
 */

/** Map a thrown error to a safe { status, code, message, details }. */
function normalizeError(error) {
  // Errors we deliberately raised (see utils/http-error.js).
  if (error instanceof HttpError) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  // express.json() reports malformed JSON as entity.parse.failed.
  if (error?.type === "entity.parse.failed") {
    return {
      status: 400,
      code: "INVALID_JSON",
      message: "The request body is not valid JSON.",
    };
  }

  // express.json() reports an over-limit body as entity.too.large.
  if (error?.type === "entity.too.large") {
    return {
      status: 413,
      code: "PAYLOAD_TOO_LARGE",
      message: "The request body is too large.",
    };
  }

  // Anything else is an unexpected server-side failure.
  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Something went wrong.",
  };
}

export function errorHandler(error, req, res, next) {
  const { status, code, message, details } = normalizeError(error);

  // The response may already be streaming; hand back to Express to avoid
  // corrupting it or throwing a second error.
  if (res.headersSent) {
    next(error);
    return;
  }

  const context = `${req.id ?? "-"} ${req.method} ${getRequestPath(req)} ${status}`;

  if (status >= 500) {
    // Full detail is logged here and nowhere else, and never sent to the client.
    // `redactText` masks credentials/tokens that a dependency may have embedded
    // in the message or the stack.
    console.error(
      `[error] ${context} ${error?.name ?? "Error"}: ${redactText(
        String(error?.message ?? "Unknown error"),
      )}`,
    );
    if (error?.stack) {
      console.error(redactText(error.stack));
    }
  } else {
    // Expected client-side mistakes: one short line, no stack, no values. The
    // raw body-parser error also carries the offending body in `error.body`;
    // it is deliberately never read or logged.
    console.warn(`[error] ${context} ${code}`);
  }

  sendError(res, { status, code, message, details });
}

export default errorHandler;
