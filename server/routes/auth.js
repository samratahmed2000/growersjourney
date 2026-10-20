import { Router } from "express";
import { sendSuccess } from "../utils/api-response.js";
import { createRequireAuth, requireRole } from "../middleware/auth.js";
import { ROLES, STAFF_ROLES } from "../auth/roles.js";

/**
 * Protected profile and access endpoints.
 *
 * Better Auth owns login/logout/session at `/api/auth/*`. These endpoints exist
 * so the Next.js server (and any future client) can ask the Express API who the
 * caller is and whether they may enter an area, using the normal `/api/v1`
 * envelope.
 *
 * Every route below independently validates the session. None of them trust a
 * role, user id, or "isAdmin" flag supplied by the browser.
 */
export function createAuthRouter({ auth } = {}) {
  const router = Router();
  const requireAuth = createRequireAuth({ auth });

  /**
   * Safe current-user profile. Never returns the session token, password hash,
   * account row, or provider data.
   */
  router.get("/auth/me", requireAuth, (req, res) => {
    sendSuccess(res, {
      user: req.auth.user,
      session: {
        expiresAt: req.auth.session.expiresAt,
      },
    });
  });

  /** Admin area: ADMIN and TEAM_MEMBER only. */
  router.get(
    "/admin/access",
    requireAuth,
    requireRole(...STAFF_ROLES),
    (req, res) => {
      sendSuccess(res, {
        area: "admin",
        role: req.auth.user.role,
      });
    },
  );

  /** Client portal: CLIENT only. Staff do not get implicit portal access. */
  router.get(
    "/portal/access",
    requireAuth,
    requireRole(ROLES.CLIENT),
    (req, res) => {
      sendSuccess(res, {
        area: "portal",
        role: req.auth.user.role,
      });
    },
  );

  return router;
}

export default createAuthRouter;
