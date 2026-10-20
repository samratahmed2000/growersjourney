import { Router } from "express";
import { notFoundError } from "../../utils/http-error.js";
import { sendPaginated, sendSuccess } from "../../utils/api-response.js";
import { validate } from "../../middleware/validate.js";
import {
  portalProjectListQuerySchema,
  portalProjectParamsSchema,
  portalUpdateListQuerySchema,
} from "../../validators/portal/project.js";
import { paginationMeta } from "../../validators/admin/common.js";
import { projectRepository as defaultProjectRepository } from "../../repositories/project-repository.js";
import { milestoneRepository as defaultMilestoneRepository } from "../../repositories/milestone-repository.js";
import { projectUpdateRepository as defaultUpdateRepository } from "../../repositories/project-update-repository.js";
import {
  serializePortalMilestone,
  serializePortalProjectDetail,
  serializePortalProjectSummary,
  serializePortalProjectUpdate,
} from "../../utils/serializers.js";

async function requireOwnedProject({ projectRepository, id, clientId }) {
  const project = await projectRepository.findForClient({ id, clientId });
  if (!project) throw notFoundError("Project not found.");
  return project;
}

export function createPortalProjectsRouter({
  projectRepository = defaultProjectRepository,
  milestoneRepository = defaultMilestoneRepository,
  updateRepository = defaultUpdateRepository,
} = {}) {
  const router = Router();

  router.get(
    "/",
    validate({ query: portalProjectListQuerySchema }),
    async (req, res) => {
      const query = req.validated.query;
      const clientId = req.portal.client.id;
      const { items, total } = await projectRepository.listForClient({
        clientId,
        page: query.page,
        limit: query.limit,
        status: query.status,
      });

      const counts = await milestoneRepository.countsForProjects(
        items.map((project) => project._id),
      );

      sendPaginated(
        res,
        {
          items: items.map((project) =>
            serializePortalProjectSummary(
              project,
              counts.get(String(project._id)),
            ),
          ),
        },
        paginationMeta({ page: query.page, limit: query.limit, total }),
      );
    },
  );

  router.get(
    "/:id",
    validate({ params: portalProjectParamsSchema }),
    async (req, res) => {
      const project = await requireOwnedProject({
        projectRepository,
        id: req.validated.params.id,
        clientId: req.portal.client.id,
      });

      const counts = await milestoneRepository.countsForProjects([project._id]);

      sendSuccess(res, {
        project: serializePortalProjectDetail(
          project,
          counts.get(String(project._id)),
        ),
      });
    },
  );

  router.get(
    "/:id/milestones",
    validate({ params: portalProjectParamsSchema }),
    async (req, res) => {
      const project = await requireOwnedProject({
        projectRepository,
        id: req.validated.params.id,
        clientId: req.portal.client.id,
      });

      const items = await milestoneRepository.listForProject(project._id);
      sendSuccess(res, { items: items.map(serializePortalMilestone) });
    },
  );

  router.get(
    "/:id/updates",
    validate({
      params: portalProjectParamsSchema,
      query: portalUpdateListQuerySchema,
    }),
    async (req, res) => {
      const project = await requireOwnedProject({
        projectRepository,
        id: req.validated.params.id,
        clientId: req.portal.client.id,
      });

      const query = req.validated.query;
      const { items, total } = await updateRepository.listForProject({
        projectId: project._id,
        page: query.page,
        limit: query.limit,
        visibility: "CLIENT",
      });

      sendPaginated(
        res,
        { items: items.map(serializePortalProjectUpdate) },
        paginationMeta({ page: query.page, limit: query.limit, total }),
      );
    },
  );

  return router;
}

export default createPortalProjectsRouter;
