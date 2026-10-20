import { Router } from "express";
import { createRequireAuth, requireRole } from "../../middleware/auth.js";
import { createRequirePortalClient } from "../../middleware/portal-access.js";
import { ROLES } from "../../auth/roles.js";
import { clientRepository as defaultClientRepository } from "../../repositories/client-repository.js";
import { createPortalDashboardRouter } from "./dashboard.js";
import { createPortalProjectsRouter } from "./projects.js";

/**
 * Client portal API.
 *
 * Role check and ownership resolution are separate steps. A CLIENT account
 * without an explicit, active Client link gets 403 even though its role is
 * valid. Every project query then uses the resolved client id from `req.portal`.
 */
export function createPortalRouter({ auth, repositories = {} } = {}) {
  const router = Router();
  const requireAuth = createRequireAuth({ auth });
  const clientRepository = repositories.clients ?? defaultClientRepository;

  router.use(requireAuth);
  router.use(requireRole(ROLES.CLIENT));
  router.use(createRequirePortalClient({ clientRepository }));

  router.use((req, res, next) => {
    res.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
    next();
  });

  router.use(
    "/dashboard",
    createPortalDashboardRouter({ repository: repositories.dashboard }),
  );
  router.use(
    "/projects",
    createPortalProjectsRouter({
      projectRepository: repositories.projects,
      milestoneRepository: repositories.milestones,
      updateRepository: repositories.updates,
    }),
  );

  return router;
}

export default createPortalRouter;
