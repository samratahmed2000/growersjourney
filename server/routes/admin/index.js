import { Router } from "express";
import { createRequireAuth, requireRole, requireTrustedOrigin } from "../../middleware/auth.js";
import { ROLES } from "../../auth/roles.js";
import { createDashboardRouter } from "./dashboard.js";
import { createAdminInquiriesRouter } from "./inquiries.js";
import { createAdminClientsRouter } from "./clients.js";
import { createAdminProjectsRouter } from "./projects.js";
import { createAdminServicesRouter } from "./services.js";
import { createAdminPortfolioRouter } from "./portfolio.js";

/**
 * ADMIN-only management API.
 *
 * Every request re-validates the Better Auth session. The role check is not a
 * UI convention: a direct call with a CLIENT or TEAM_MEMBER cookie gets a 403.
 * State-changing requests also require a trusted Origin.
 */
export function createAdminRouter({
  auth,
  allowedOrigins = [],
  repositories = {},
} = {}) {
  const router = Router();
  const requireAuth = createRequireAuth({ auth });

  router.use(requireAuth);
  router.use(requireRole(ROLES.ADMIN));
  router.use(requireTrustedOrigin({ allowedOrigins }));

  // Admin responses may contain client contact details and internal notes.
  // Never let a browser or intermediary cache them.
  router.use((req, res, next) => {
    res.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
    next();
  });

  router.use(
    "/dashboard",
    createDashboardRouter({ repository: repositories.dashboard }),
  );
  router.use(
    "/inquiries",
    createAdminInquiriesRouter({ repository: repositories.inquiries }),
  );
  router.use(
    "/clients",
    createAdminClientsRouter({
      repository: repositories.clients,
      projectRepository: repositories.projects,
      auth,
    }),
  );
  router.use(
    "/projects",
    createAdminProjectsRouter({
      repository: repositories.projects,
      clientRepository: repositories.clients,
      milestoneRepository: repositories.milestones,
      updateRepository: repositories.updates,
    }),
  );
  router.use(
    "/services",
    createAdminServicesRouter({ repository: repositories.services }),
  );
  router.use(
    "/portfolio",
    createAdminPortfolioRouter({ repository: repositories.portfolio }),
  );

  return router;
}

export default createAdminRouter;
