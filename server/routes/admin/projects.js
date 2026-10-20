import { Router } from "express";
import { badRequest, HttpError, notFoundError } from "../../utils/http-error.js";
import { sendPaginated, sendSuccess } from "../../utils/api-response.js";
import { validate } from "../../middleware/validate.js";
import {
  createProjectSchema,
  projectIdParamsSchema,
  projectListQuerySchema,
  updateProjectSchema,
  updateProjectStatusSchema,
} from "../../validators/admin/project.js";
import { paginationMeta } from "../../validators/admin/common.js";
import { INITIAL_PROJECT_STATUS } from "../../constants/project.js";
import { projectRepository as defaultRepository } from "../../repositories/project-repository.js";
import { clientRepository as defaultClientRepository } from "../../repositories/client-repository.js";
import { milestoneRepository as defaultMilestoneRepository } from "../../repositories/milestone-repository.js";
import { projectUpdateRepository as defaultUpdateRepository } from "../../repositories/project-update-repository.js";
import {
  serializeProjectDetail,
  serializeProjectSummary,
} from "../../utils/serializers.js";
import { createAdminProjectMilestonesRouter } from "./project-milestones.js";
import { createAdminProjectUpdatesRouter } from "./project-updates.js";

function assertProjectDates({ startDate, dueDate }) {
  if (!startDate || !dueDate) return;
  if (new Date(dueDate) < new Date(startDate)) {
    throw badRequest("Please check the submitted information.", [
      {
        field: "body.dueDate",
        message: "The expected completion date cannot be before the start date.",
      },
    ]);
  }
}

async function requireClient({
  clientRepository,
  clientId,
  currentClientId,
  allowCurrentInactive = false,
}) {
  const client = await clientRepository.findById(clientId);
  if (!client) throw notFoundError("Client not found.");

  const sameClient =
    currentClientId && String(currentClientId) === String(clientId);

  if (client.status !== "ACTIVE" && !(allowCurrentInactive && sameClient)) {
    throw new HttpError(
      409,
      "CLIENT_INACTIVE",
      "A project cannot be assigned to an inactive client.",
    );
  }

  return client;
}

export function createAdminProjectsRouter({
  repository = defaultRepository,
  clientRepository = defaultClientRepository,
  milestoneRepository = defaultMilestoneRepository,
  updateRepository = defaultUpdateRepository,
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

  router.post("/", validate({ body: createProjectSchema }), async (req, res) => {
    const body = req.validated.body;
    assertProjectDates(body);

    await requireClient({
      clientRepository,
      clientId: body.clientId,
    });

    const project = await repository.create({
      ...body,
      status: INITIAL_PROJECT_STATUS,
      createdBy: req.auth.user.id,
      updatedBy: req.auth.user.id,
    });

    sendSuccess(
      res,
      {
        project: serializeProjectDetail(project, {
          milestoneCounts: { total: 0, completed: 0 },
        }),
      },
      201,
    );
  });

  router.get(
    "/:id",
    validate({ params: projectIdParamsSchema }),
    async (req, res) => {
      const { id } = req.validated.params;
      const project = await repository.findById(id);
      if (!project) throw notFoundError("Project not found.");

      const counts = await milestoneRepository.countsForProjects([project._id]);
      sendSuccess(res, {
        project: serializeProjectDetail(project, {
          milestoneCounts: counts.get(String(project._id)),
        }),
      });
    },
  );

  router.patch(
    "/:id",
    validate({ params: projectIdParamsSchema, body: updateProjectSchema }),
    async (req, res) => {
      const { id } = req.validated.params;
      const changes = { ...req.validated.body };

      const current = await repository.findRawById(id);
      if (!current) throw notFoundError("Project not found.");

      assertProjectDates({
        startDate:
          changes.startDate !== undefined
            ? changes.startDate
            : current.startDate,
        dueDate: changes.dueDate !== undefined ? changes.dueDate : current.dueDate,
      });

      if (changes.clientId !== undefined) {
        await requireClient({
          clientRepository,
          clientId: changes.clientId,
          currentClientId: current.clientId,
          allowCurrentInactive: true,
        });
      }

      const project = await repository.update({
        id,
        changes: { ...changes, updatedBy: req.auth.user.id },
      });
      if (!project) throw notFoundError("Project not found.");

      const counts = await milestoneRepository.countsForProjects([project._id]);
      sendSuccess(res, {
        project: serializeProjectDetail(project, {
          milestoneCounts: counts.get(String(project._id)),
        }),
      });
    },
  );

  router.patch(
    "/:id/status",
    validate({
      params: projectIdParamsSchema,
      body: updateProjectStatusSchema,
    }),
    async (req, res) => {
      const { id } = req.validated.params;
      const result = await repository.updateStatus({
        id,
        status: req.validated.body.status,
        changedBy: req.auth.user.id,
      });

      if (result.kind === "not_found") {
        throw notFoundError("Project not found.");
      }

      if (result.kind === "invalid") {
        throw new HttpError(
          409,
          "INVALID_STATUS_TRANSITION",
          `A project cannot move from ${result.currentStatus} to ${req.validated.body.status}.`,
        );
      }

      if (result.kind === "conflict") {
        throw new HttpError(
          409,
          "STATUS_CHANGED",
          "The project status changed while you were editing. Refresh and try again.",
        );
      }

      const counts = await milestoneRepository.countsForProjects([
        result.project._id,
      ]);
      sendSuccess(res, {
        project: serializeProjectDetail(result.project, {
          milestoneCounts: counts.get(String(result.project._id)),
        }),
      });
    },
  );

  router.use(
    "/:id/milestones",
    createAdminProjectMilestonesRouter({
      projectRepository: repository,
      milestoneRepository,
    }),
  );

  router.use(
    "/:id/updates",
    createAdminProjectUpdatesRouter({
      projectRepository: repository,
      updateRepository,
    }),
  );

  return router;
}

export default createAdminProjectsRouter;
