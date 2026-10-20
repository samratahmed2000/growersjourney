import { Router } from "express";
import { HttpError, notFoundError } from "../../utils/http-error.js";
import { sendPaginated, sendSuccess } from "../../utils/api-response.js";
import { validate } from "../../middleware/validate.js";
import {
  clientIdParamsSchema,
  clientListQuerySchema,
  createClientSchema,
  updateClientSchema,
} from "../../validators/admin/client.js";
import { paginationMeta } from "../../validators/admin/common.js";
import { clientRepository as defaultRepository } from "../../repositories/client-repository.js";
import { projectRepository as defaultProjectRepository } from "../../repositories/project-repository.js";
import {
  serializeClientDetail,
  serializeClientSummary,
  serializeProjectSummary,
} from "../../utils/serializers.js";
import { isDuplicateKeyError } from "../../utils/mongo-errors.js";

function duplicateEmailError() {
  return new HttpError(
    409,
    "DUPLICATE_CLIENT_EMAIL",
    "A client with this email address already exists.",
    [{ field: "body.primaryEmail", message: "This email is already in use." }],
  );
}

export function createAdminClientsRouter({
  repository = defaultRepository,
  projectRepository = defaultProjectRepository,
} = {}) {
  const router = Router();

  router.get("/", validate({ query: clientListQuerySchema }), async (req, res) => {
    const query = req.validated.query;
    const { items, total } = await repository.list(query);

    sendPaginated(
      res,
      { items: items.map(serializeClientSummary) },
      paginationMeta({ page: query.page, limit: query.limit, total }),
    );
  });

  router.post("/", validate({ body: createClientSchema }), async (req, res) => {
    const existing = await repository.findByEmail(req.validated.body.primaryEmail);
    if (existing) throw duplicateEmailError();

    let client;
    try {
      client = await repository.create({
        ...req.validated.body,
        updatedBy: req.auth.user.id,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) throw duplicateEmailError();
      throw error;
    }

    sendSuccess(res, { client: serializeClientDetail(client) }, 201);
  });

  router.get(
    "/:id",
    validate({ params: clientIdParamsSchema }),
    async (req, res) => {
      const { id } = req.validated.params;
      const client = await repository.findById(id);
      if (!client) throw notFoundError("Client not found.");

      const projects = await projectRepository.listByClientId(id);
      sendSuccess(res, {
        client: serializeClientDetail(client),
        projects: projects.map(serializeProjectSummary),
      });
    },
  );

  router.patch(
    "/:id",
    validate({ params: clientIdParamsSchema, body: updateClientSchema }),
    async (req, res) => {
      const { id } = req.validated.params;
      const changes = { ...req.validated.body };

      if (changes.primaryEmail) {
        const existing = await repository.findByEmail(changes.primaryEmail);
        if (existing && String(existing._id ?? existing.id) !== id) {
          throw duplicateEmailError();
        }
      }

      let client;
      try {
        client = await repository.update({
          id,
          changes: { ...changes, updatedBy: req.auth.user.id },
        });
      } catch (error) {
        if (isDuplicateKeyError(error)) throw duplicateEmailError();
        throw error;
      }

      if (!client) throw notFoundError("Client not found.");
      sendSuccess(res, { client: serializeClientDetail(client) });
    },
  );

  return router;
}

export default createAdminClientsRouter;
