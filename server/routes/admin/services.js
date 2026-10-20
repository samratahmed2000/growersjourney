import { Router } from "express";
import { HttpError, notFoundError } from "../../utils/http-error.js";
import { sendPaginated, sendSuccess } from "../../utils/api-response.js";
import { validate } from "../../middleware/validate.js";
import {
  createServiceSchema,
  serviceIdParamsSchema,
  serviceListQuerySchema,
  updateServiceSchema,
} from "../../validators/admin/service.js";
import { paginationMeta } from "../../validators/admin/common.js";
import { serviceRepository as defaultRepository } from "../../repositories/service-repository.js";
import { serializeService } from "../../utils/serializers.js";
import { isDuplicateKeyError } from "../../utils/mongo-errors.js";

function duplicateSlugError() {
  return new HttpError(
    409,
    "DUPLICATE_SLUG",
    "A service with this slug already exists.",
    [{ field: "body.slug", message: "This slug is already in use." }],
  );
}

export function createAdminServicesRouter({
  repository = defaultRepository,
} = {}) {
  const router = Router();

  router.get("/", validate({ query: serviceListQuerySchema }), async (req, res) => {
    const query = req.validated.query;
    const { items, total } = await repository.list({
      ...query,
      includeArchived: query.includeArchived ?? false,
    });

    sendPaginated(
      res,
      { items: items.map(serializeService) },
      paginationMeta({ page: query.page, limit: query.limit, total }),
    );
  });

  router.post("/", validate({ body: createServiceSchema }), async (req, res) => {
    const existing = await repository.findBySlug(req.validated.body.slug);
    if (existing) throw duplicateSlugError();

    let service;
    try {
      service = await repository.create({
        ...req.validated.body,
        updatedBy: req.auth.user.id,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) throw duplicateSlugError();
      throw error;
    }

    sendSuccess(res, { service: serializeService(service) }, 201);
  });

  router.get(
    "/:id",
    validate({ params: serviceIdParamsSchema }),
    async (req, res) => {
      const service = await repository.findById(req.validated.params.id);
      if (!service) throw notFoundError("Service not found.");
      sendSuccess(res, { service: serializeService(service) });
    },
  );

  router.patch(
    "/:id",
    validate({ params: serviceIdParamsSchema, body: updateServiceSchema }),
    async (req, res) => {
      const { id } = req.validated.params;
      const changes = { ...req.validated.body };
      const current = await repository.findById(id);
      if (!current) throw notFoundError("Service not found.");

      if (current.isArchived && changes.isPublished === true) {
        throw new HttpError(
          409,
          "ARCHIVED_RECORD",
          "Restore this service before publishing it.",
        );
      }

      if (changes.isArchived === true) {
        changes.isPublished = false;
      }

      let service;
      try {
        service = await repository.update({
          id,
          changes: { ...changes, updatedBy: req.auth.user.id },
        });
      } catch (error) {
        if (isDuplicateKeyError(error)) throw duplicateSlugError();
        throw error;
      }

      if (!service) throw notFoundError("Service not found.");
      sendSuccess(res, { service: serializeService(service) });
    },
  );

  router.delete(
    "/:id",
    validate({ params: serviceIdParamsSchema }),
    async (req, res) => {
      const service = await repository.archive({
        id: req.validated.params.id,
        updatedBy: req.auth.user.id,
      });
      if (!service) throw notFoundError("Service not found.");
      sendSuccess(res, { service: serializeService(service) });
    },
  );

  return router;
}

export default createAdminServicesRouter;
