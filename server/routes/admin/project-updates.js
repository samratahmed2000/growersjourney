import { Router } from "express";
import { notFoundError } from "../../utils/http-error.js";
import { sendPaginated, sendSuccess } from "../../utils/api-response.js";
import { validate } from "../../middleware/validate.js";
import {
  createProjectUpdateSchema,
  projectUpdateListQuerySchema,
  projectUpdateParamsSchema,
  updateProjectUpdateSchema,
} from "../../validators/admin/project-update.js";
import { paginationMeta } from "../../validators/admin/common.js";
import { projectIdParamsSchema } from "../../validators/admin/project.js";
import { projectRepository as defaultProjectRepository } from "../../repositories/project-repository.js";
import { projectUpdateRepository as defaultUpdateRepository } from "../../repositories/project-update-repository.js";
import {
  serializeProjectUpdate,
} from "../../utils/serializers.js";

export function createAdminProjectUpdatesRouter({
  projectRepository = defaultProjectRepository,
  updateRepository = defaultUpdateRepository,
} = {}) {
  const router = Router({ mergeParams: true });

  router.get(
    "/",
    validate({
      params: projectIdParamsSchema,
      query: projectUpdateListQuerySchema,
    }),
    async (req, res) => {
      const project = await projectRepository.findById(req.params.id);
      if (!project) throw notFoundError("Project not found.");

      const query = req.validated.query;
      const { items, total } = await updateRepository.listForProject({
        projectId: project._id,
        page: query.page,
        limit: query.limit,
      });

      sendPaginated(
        res,
        { items: items.map(serializeProjectUpdate) },
        paginationMeta({ page: query.page, limit: query.limit, total }),
      );
    },
  );

  router.post(
    "/",
    validate({
      params: projectIdParamsSchema,
      body: createProjectUpdateSchema,
    }),
    async (req, res) => {
      const project = await projectRepository.findById(req.params.id);
      if (!project) throw notFoundError("Project not found.");

      const update = await updateRepository.create({
        ...req.validated.body,
        projectId: project._id,
        authorId: req.auth.user.id,
        authorName: req.auth.user.name,
        updatedBy: req.auth.user.id,
      });

      await projectRepository.touch({
        id: project._id,
        updatedBy: req.auth.user.id,
      });

      sendSuccess(res, { update: serializeProjectUpdate(update) }, 201);
    },
  );

  router.patch(
    "/:updateId",
    validate({
      params: projectUpdateParamsSchema,
      body: updateProjectUpdateSchema,
    }),
    async (req, res) => {
      const { id, updateId } = req.validated.params;
      const project = await projectRepository.findById(id);
      if (!project) throw notFoundError("Project not found.");

      const update = await updateRepository.update({
        id: updateId,
        projectId: project._id,
        changes: {
          ...req.validated.body,
          updatedBy: req.auth.user.id,
        },
      });
      if (!update) throw notFoundError("Project update not found.");

      await projectRepository.touch({
        id: project._id,
        updatedBy: req.auth.user.id,
      });

      sendSuccess(res, { update: serializeProjectUpdate(update) });
    },
  );

  return router;
}

export default createAdminProjectUpdatesRouter;
