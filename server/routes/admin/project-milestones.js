import { Router } from "express";
import { badRequest, HttpError, notFoundError } from "../../utils/http-error.js";
import { sendSuccess } from "../../utils/api-response.js";
import { validate } from "../../middleware/validate.js";
import {
  createMilestoneSchema,
  projectMilestoneParamsSchema,
  updateMilestoneSchema,
} from "../../validators/admin/milestone.js";
import { projectIdParamsSchema } from "../../validators/admin/project.js";
import {
  INITIAL_MILESTONE_STATUS,
  MILESTONE_STATUS_TRANSITIONS,
} from "../../constants/milestone.js";
import { projectRepository as defaultProjectRepository } from "../../repositories/project-repository.js";
import { milestoneRepository as defaultMilestoneRepository } from "../../repositories/milestone-repository.js";
import { serializeMilestone } from "../../utils/serializers.js";

function assertDueDateWithinProject(project, dueDate) {
  if (dueDate === undefined || dueDate === null) return;

  if (project.startDate && dueDate < new Date(project.startDate)) {
    throw badRequest("Please check the submitted information.", [
      {
        field: "body.dueDate",
        message: "The milestone due date cannot be before the project start date.",
      },
    ]);
  }

  if (project.dueDate && dueDate > new Date(project.dueDate)) {
    throw badRequest("Please check the submitted information.", [
      {
        field: "body.dueDate",
        message:
          "The milestone due date cannot be after the project expected completion date.",
      },
    ]);
  }
}

export function createAdminProjectMilestonesRouter({
  projectRepository = defaultProjectRepository,
  milestoneRepository = defaultMilestoneRepository,
} = {}) {
  const router = Router({ mergeParams: true });

  router.get(
    "/",
    validate({ params: projectIdParamsSchema }),
    async (req, res) => {
      const project = await projectRepository.findById(req.params.id);
      if (!project) throw notFoundError("Project not found.");

      const items = await milestoneRepository.listForProject(project._id);
      sendSuccess(res, { items: items.map(serializeMilestone) });
    },
  );

  router.post(
    "/",
    validate({ params: projectIdParamsSchema, body: createMilestoneSchema }),
    async (req, res) => {
      const project = await projectRepository.findById(req.params.id);
      if (!project) throw notFoundError("Project not found.");

      const body = req.validated.body;
      assertDueDateWithinProject(project, body.dueDate);

      const milestone = await milestoneRepository.create({
        ...body,
        projectId: project._id,
        status: INITIAL_MILESTONE_STATUS,
        createdBy: req.auth.user.id,
        updatedBy: req.auth.user.id,
      });

      await projectRepository.touch({
        id: project._id,
        updatedBy: req.auth.user.id,
      });

      sendSuccess(res, { milestone: serializeMilestone(milestone) }, 201);
    },
  );

  router.patch(
    "/:milestoneId",
    validate({
      params: projectMilestoneParamsSchema,
      body: updateMilestoneSchema,
    }),
    async (req, res) => {
      const { id, milestoneId } = req.validated.params;
      const project = await projectRepository.findById(id);
      if (!project) throw notFoundError("Project not found.");

      const current = await milestoneRepository.findForProject({
        id: milestoneId,
        projectId: project._id,
      });
      if (!current) throw notFoundError("Milestone not found.");

      const changes = { ...req.validated.body };

      if (
        changes.dueDate !== undefined &&
        changes.dueDate !== null
      ) {
        assertDueDateWithinProject(project, changes.dueDate);
      }

      let expectedStatus;
      if (changes.status && changes.status !== current.status) {
        const allowed = MILESTONE_STATUS_TRANSITIONS[current.status] ?? [];
        if (!allowed.includes(changes.status)) {
          throw new HttpError(
            409,
            "INVALID_STATUS_TRANSITION",
            `A milestone cannot move from ${current.status} to ${changes.status}.`,
          );
        }
        expectedStatus = current.status;
      }

      const milestone = await milestoneRepository.update({
        id: milestoneId,
        projectId: project._id,
        changes: { ...changes, updatedBy: req.auth.user.id },
        expectedStatus,
      });

      if (!milestone) {
        throw new HttpError(
          409,
          "STATUS_CHANGED",
          "The milestone changed while you were editing. Refresh and try again.",
        );
      }

      await projectRepository.touch({
        id: project._id,
        updatedBy: req.auth.user.id,
      });

      sendSuccess(res, { milestone: serializeMilestone(milestone) });
    },
  );

  return router;
}

export default createAdminProjectMilestonesRouter;
