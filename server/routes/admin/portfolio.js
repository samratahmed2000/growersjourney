import { Router } from "express";
import { HttpError, notFoundError } from "../../utils/http-error.js";
import { sendPaginated, sendSuccess } from "../../utils/api-response.js";
import { validate } from "../../middleware/validate.js";
import {
  createPortfolioSchema,
  portfolioIdParamsSchema,
  portfolioListQuerySchema,
  updatePortfolioSchema,
} from "../../validators/admin/portfolio.js";
import { paginationMeta } from "../../validators/admin/common.js";
import { portfolioRepository as defaultRepository } from "../../repositories/portfolio-repository.js";
import { serializePortfolio } from "../../utils/serializers.js";
import { isDuplicateKeyError } from "../../utils/mongo-errors.js";

function duplicateSlugError() {
  return new HttpError(
    409,
    "DUPLICATE_SLUG",
    "A portfolio entry with this slug already exists.",
    [{ field: "body.slug", message: "This slug is already in use." }],
  );
}

export function createAdminPortfolioRouter({
  repository = defaultRepository,
} = {}) {
  const router = Router();

  router.get("/", validate({ query: portfolioListQuerySchema }), async (req, res) => {
    const query = req.validated.query;
    const { items, total } = await repository.list({
      ...query,
      includeArchived: query.includeArchived ?? false,
    });

    sendPaginated(
      res,
      { items: items.map(serializePortfolio) },
      paginationMeta({ page: query.page, limit: query.limit, total }),
    );
  });

  router.post("/", validate({ body: createPortfolioSchema }), async (req, res) => {
    const data = {
      ...req.validated.body,
      updatedBy: req.auth.user.id,
    };
    if (data.isPublished) data.publishedAt = new Date();

    let project;
    try {
      project = await repository.create(data);
    } catch (error) {
      if (isDuplicateKeyError(error)) throw duplicateSlugError();
      throw error;
    }

    sendSuccess(res, { portfolio: serializePortfolio(project) }, 201);
  });

  router.get(
    "/:id",
    validate({ params: portfolioIdParamsSchema }),
    async (req, res) => {
      const project = await repository.findById(req.validated.params.id);
      if (!project) throw notFoundError("Portfolio entry not found.");
      sendSuccess(res, { portfolio: serializePortfolio(project) });
    },
  );

  router.patch(
    "/:id",
    validate({ params: portfolioIdParamsSchema, body: updatePortfolioSchema }),
    async (req, res) => {
      const { id } = req.validated.params;
      const changes = { ...req.validated.body };
      const current = await repository.findById(id);
      if (!current) throw notFoundError("Portfolio entry not found.");

      const finalPublished = changes.isPublished ?? current.isPublished;

      if (changes.isPublished === true && current.isArchived) {
        throw new HttpError(
          409,
          "ARCHIVED_RECORD",
          "Restore this portfolio entry before publishing it.",
        );
      }
      if (changes.isFeatured === true && !finalPublished) {
        throw new HttpError(
          409,
          "INVALID_PUBLICATION_STATE",
          "A portfolio entry must be published before it can be featured.",
        );
      }
      if (changes.isPublished === false) {
        changes.isFeatured = false;
      }
      if (changes.isArchived === true) {
        changes.isPublished = false;
        changes.isFeatured = false;
      }

      let project;
      try {
        project = await repository.update({
          id,
          changes,
          updatedBy: req.auth.user.id,
        });
      } catch (error) {
        if (isDuplicateKeyError(error)) throw duplicateSlugError();
        throw error;
      }

      if (!project) throw notFoundError("Portfolio entry not found.");
      sendSuccess(res, { portfolio: serializePortfolio(project) });
    },
  );

  router.delete(
    "/:id",
    validate({ params: portfolioIdParamsSchema }),
    async (req, res) => {
      const project = await repository.archive({
        id: req.validated.params.id,
        updatedBy: req.auth.user.id,
      });
      if (!project) throw notFoundError("Portfolio entry not found.");
      sendSuccess(res, { portfolio: serializePortfolio(project) });
    },
  );

  return router;
}

export default createAdminPortfolioRouter;
