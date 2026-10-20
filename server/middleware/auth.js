import { fromNodeHeaders } from "better-auth/node";
import { HttpError } from "../utils/http-error.js";
import { toSafeUser } from "../auth/access-control.js";
import { normalizeRole } from "../auth/roles.js";

/**
 * Reusable authentication and authorization middleware for the Express API.
 *
 * The important property: every protected request is validated independently
 * by asking Better Auth for the session. A Next.js page guard has no bearing on
 * this code, so calling the API directly with curl gets exactly the same answer
 * as clicking a link in the browser.
 */

/**
 * Build the `requireAuth` middleware for a specific Better Auth instance.
 *
 * `auth.api.getSession()` is the documented server-side validation method. It
 * reads the signed session cookie, looks the session up in MongoDB, and returns
 * `null` for a missing, expired, or revoked session.
 *
 * Only a narrow identity is attached to the request. The raw session token and
 * the authentication account record are deliberately never put on `req`, so a
 * later route cannot accidentally return them.
 *
 * @param {{ auth: { api: { getSession: Function } } }} options
 */
export function createRequireAuth({ auth } = {}) {
  if (typeof auth?.api?.getSession !== "function") {
    throw new Error("createRequireAuth() requires a Better Auth instance.");
  }

  return async function requireAuth(req, res, next) {
    try {
      const authSession = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (!authSession?.user) {
        throw new HttpError(
          401,
          "UNAUTHENTICATED",
          "Authentication is required.",
        );
      }

      // An authenticated account with a missing/unknown role is not authorized.
      // This is the deny-by-default path, not a fallback to CLIENT.
      if (!normalizeRole(authSession.user.role)) {
        throw new HttpError(
          403,
          "FORBIDDEN",
          "Your account is not authorized for this area.",
        );
      }

      req.auth = {
        user: toSafeUser(authSession.user),
        session: {
          expiresAt: authSession.session?.expiresAt ?? null,
        },
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Role guard. Must run after `requireAuth`.
 *
 * If `req.auth` is missing, the request is unauthenticated (401) rather than
 * accidentally authorized. If the role is not explicitly allowed, it is a 403.
 *
 * @param {...string} allowedRoles
 */
export function requireRole(...allowedRoles) {
  const allowed = new Set(allowedRoles);

  return function roleGuard(req, res, next) {
    if (!req.auth?.user) {
      next(
        new HttpError(401, "UNAUTHENTICATED", "Authentication is required."),
      );
      return;
    }

    if (!allowed.has(req.auth.user.role)) {
      next(
        new HttpError(
          403,
          "FORBIDDEN",
          "You do not have permission to access this resource.",
        ),
      );
      return;
    }

    next();
  };
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Origin guard for future state-changing protected endpoints.
 *
 * `SameSite=Lax` already blocks most cross-site cookie writes, and Better Auth
 * applies its own Origin/Fetch-Metadata checks to its endpoints. This guard is
 * the matching explicit check for ordinary API writes, so a future POST/PATCH/
 * DELETE cannot rely on SameSite alone.
 *
 * Safe methods pass through. A write must carry an `Origin` header from the
 * configured frontend allowlist; a missing Origin is rejected because a browser
 * always sends one for a cross-origin or same-origin CORS-relevant request, and
 * accepting "no Origin" would let a non-browser caller skip the check.
 *
 * @param {{ allowedOrigins?: string[] }} options
 */
export function requireTrustedOrigin({ allowedOrigins = [] } = {}) {
  const allowed = new Set(
    allowedOrigins.map((origin) => String(origin).replace(/\/+$/, "")),
  );

  return function originGuard(req, res, next) {
    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }

    const origin = req.get("origin");
    const normalized = origin ? origin.replace(/\/+$/, "") : "";

    if (!normalized || !allowed.has(normalized)) {
      next(
        new HttpError(
          403,
          "INVALID_ORIGIN",
          "The request origin is not allowed.",
        ),
      );
      return;
    }

    next();
  };
}
