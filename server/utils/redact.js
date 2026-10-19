/**
 * Redaction of sensitive values before anything is written to a log.
 *
 * Why this exists:
 * the request logger is already built so that it *cannot* log a body, a header,
 * a cookie, or a query string — it only ever logs the method, path, status, and
 * duration. That covers request data by omission.
 *
 * Error messages are a different story. A message can come from anywhere:
 * an HTTP client, a driver, a third-party SDK. Those libraries sometimes put a
 * connection string, an API key, or a token into the message or into the stack.
 * Writing that to a log file is still a leak, even though the client never sees
 * it. So the few places that log error text pass it through `redactText` first.
 *
 * This is a safety net, not a licence to log secrets: never pass a request body,
 * headers, cookies, or credentials to a logger in the first place.
 */

/** Longest text kept in a log line. Anything beyond this is dropped. */
const MAX_LENGTH = 4000;

/** Applied in order; each rule masks one shape of sensitive value. */
const REDACTION_RULES = [
  {
    // mongodb+srv://user:password@host, https://user:password@host, redis://...
    // Keeps the scheme and the host, masks the credentials.
    pattern: /([a-z][a-z0-9+.-]*:\/\/)[^@\s/]+@/gi,
    replacement: "$1[redacted]@",
  },
  {
    // Authorization: Bearer <token> / Basic <base64>
    pattern: /\b(bearer|basic)\s+[A-Za-z0-9._~+/=-]{6,}/gi,
    replacement: "$1 [redacted]",
  },
  {
    // key=value and key: value forms, e.g. password=..., apiKey: ..., cookie=...
    // The lookahead skips an authorization scheme: "Authorization: Bearer xyz"
    // is already handled by the rule above, and matching here would consume the
    // word "Bearer" and leave a stray second "[redacted]".
    pattern:
      /\b(password|passwd|pwd|secret|token|signature|apikey|api_key|api-key|access_key|authorization|cookie)\b\s*[=:]\s*"?(?!bearer\b|basic\b)[^\s"&,;]{3,}"?/gi,
    replacement: "$1=[redacted]",
  },
  {
    // JSON Web Tokens (header.payload.signature, base64url).
    pattern: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,}\b/g,
    replacement: "[redacted-jwt]",
  },
];

/**
 * Mask sensitive values in a string and cap its length.
 *
 * Non-strings are returned unchanged so callers can pass `undefined` safely.
 */
export function redactText(value) {
  if (typeof value !== "string" || value.length === 0) {
    return value;
  }

  // Redact first, then truncate: cutting first could leave half a credential
  // behind in the middle of a connection string, where no rule would match.
  let text = value;
  for (const { pattern, replacement } of REDACTION_RULES) {
    text = text.replace(pattern, replacement);
  }

  return text.length > MAX_LENGTH ? `${text.slice(0, MAX_LENGTH)}…[truncated]` : text;
}

export default redactText;
