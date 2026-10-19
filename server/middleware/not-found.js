import { sendError } from "../utils/api-response.js";

/**
 * Terminal handler for unmatched routes.
 *
 * Registered after every route and before the error handler. It always returns
 * the same JSON error envelope, so this server never replies with Express's
 * default HTML page (which would expose framework details and break API clients).
 */
export function notFound(req, res) {
  sendError(res, {
    status: 404,
    code: "NOT_FOUND",
    message: "The requested resource was not found.",
  });
}

export default notFound;
