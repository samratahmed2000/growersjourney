import { Router } from "express";
import {
  createRequireAuth,
  requireRole,
  requireTrustedOrigin,
} from "../../middleware/auth.js";
import { createRequirePortalClient } from "../../middleware/portal-access.js";
import { ROLES } from "../../auth/roles.js";
import { clientRepository as defaultClientRepository } from "../../repositories/client-repository.js";
import { createPortalDashboardRouter } from "./dashboard.js";
import { createPortalProjectsRouter } from "./projects.js";
import { createPortalInvoicesRouter } from "./invoices.js";
import { createPortalPaymentsRouter } from "./payments.js";

/**
 * Client portal API.
 *
 * Role check and ownership resolution are separate steps. A CLIENT account
 * without an explicit, active Client link gets 403 even though its role is
 * valid. Every project query then uses the resolved client id from `req.portal`.
 */
export function createPortalRouter({
  auth,
  allowedOrigins = [],
  repositories = {},
  finance = null,
} = {}) {
  const router = Router();
  const requireAuth = createRequireAuth({ auth });
  const clientRepository = repositories.clients ?? defaultClientRepository;

  router.use(requireAuth);
  router.use(requireRole(ROLES.CLIENT));
  router.use(createRequirePortalClient({ clientRepository }));
  // Payment-session creation is a browser write. Reject a cross-site Origin
  // even though the session cookie is SameSite=Lax; defence in depth.
  router.use(requireTrustedOrigin({ allowedOrigins }));

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

  if (finance?.invoiceService && finance?.paymentService) {
    router.use(
      "/invoices",
      createPortalInvoicesRouter({
        invoiceService: finance.invoiceService,
        paymentService: finance.paymentService,
      }),
    );
    router.use(
      "/payments",
      createPortalPaymentsRouter({
        paymentService: finance.paymentService,
      }),
    );
  }

  return router;
}

export default createPortalRouter;
