/**
 * The full request path, with the query string removed.
 *
 * Why this helper exists instead of using `req.path` directly:
 * Express mounts routers with `use("/api/v1", router)` and, while a mounted
 * router handles the request, `req.url` (and therefore `req.path`) has the
 * mount prefix stripped. A response that finishes inside the router — or an
 * error logged from there — would then report `/health` instead of the real
 * `/api/v1/health`, which makes logs useless for tracing.
 *
 * `req.originalUrl` keeps the path the client actually requested, so it is used
 * when available. The query string is deliberately dropped: it can contain
 * tokens, emails, or other personal data. See middleware/request-logger.js.
 */
export function getRequestPath(req) {
  const url = req.originalUrl ?? req.url ?? "";
  const queryIndex = url.indexOf("?");

  return queryIndex === -1 ? url : url.slice(0, queryIndex);
}

export default getRequestPath;
