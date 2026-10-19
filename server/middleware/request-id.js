import { randomUUID } from "node:crypto";

/**
 * Attach a unique id to every request and echo it back in `x-request-id`.
 *
 * Why we generate our own id instead of reusing an incoming header:
 * a client-supplied value could contain newlines or fake content and pollute
 * the logs (log injection). Only server-generated ids are trusted.
 *
 * The id is also useful for correlation: it appears in the request log line and
 * in server-side error logs, so a reported problem can be traced without ever
 * sending internal details to the client.
 */
export function requestId(req, res, next) {
  req.id = randomUUID();
  res.setHeader("x-request-id", req.id);
  next();
}

export default requestId;
