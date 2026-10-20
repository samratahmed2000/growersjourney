/**
 * Baseline security headers for every API response.
 *
 * Why this is not a full CSP: JSON API responses do not render HTML, and the
 * browser-facing CSP belongs on the Next.js site. These headers still prevent
 * MIME sniffing and framing, and limit browser feature access if a JSON or
 * error page is ever opened directly.
 *
 * HSTS is only sent when the caller says the API is served over HTTPS. Sending
 * it from a plain-HTTP development server would be ignored by browsers anyway,
 * but making the choice explicit keeps production behavior obvious.
 */
export function createSecurityHeaders({ hsts = false } = {}) {
  return function securityHeaders(req, res, next) {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("X-Frame-Options", "DENY");
    res.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=()",
    );

    if (hsts) {
      res.set("Strict-Transport-Security", "max-age=31536000");
    }

    next();
  };
}

export default createSecurityHeaders;
