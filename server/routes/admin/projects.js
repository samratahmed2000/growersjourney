import { Router } from "express";
import { notFoundError } from "../../utils/http-error.js";
import { sendPaginated, sendSuccess } from "../../utils/api-response.js";
import { validate } from "../../middleware/validate.js";
import {
  projectIdParamsSchema,
  projectListQuerySchema,
} from "../../validators/admin/project.js";
import { paginationMeta } from "../../validators/admin/common.js";
import { projectRepository as defaultRepository } from "../../repositories/project-repository.js";
import {
  serializeProjectDetail,
  serializeProjectSummary,
} from "../../utils/serializers.js";

export function createAdminProjectsRouter({
  repository = defaultRepository,
} = {}) {
  const router = Router();

  router.get("/", validate({ query: projectListQuerySchema }), async (req, res) => {
    const query = req.validated.query;
    const { items, total } = await repository.list(query);

    sendPaginated(
      res,
      { items: items.map(serializeProjectSummary) },
      paginationMeta({ page: query.page, limit: query.limit, total }),
    );
  });

  router.get(
    "/:id",
    validate({ params: projectIdParamsSchema }),
    async (req, res) => {
      const project = await repository.findById(req.validated.params.id);
      if (!project) throw notFoundError("Project not found.");
      sendSuccess(res, { project: serializeProjectDetail(project) });
    },
  );

  return router;
}

export default createAdminProjectsRouter;
