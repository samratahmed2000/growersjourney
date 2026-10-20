import { Router } from "express";
import { HttpError, notFoundError } from "../../utils/http-error.js";
import { sendPaginated, sendSuccess } from "../../utils/api-response.js";
import { validate } from "../../middleware/validate.js";
import {
  inquiryIdParamsSchema,
  inquiryListQuerySchema,
  updateInquirySchema,
} from "../../validators/admin/inquiry.js";
import { paginationMeta } from "../../validators/admin/common.js";
import { INQUIRY_STATUS_TRANSITIONS } from "../../constants/inquiry.js";
import { adminInquiryRepository as defaultRepository } from "../../repositories/admin-inquiry-repository.js";
import {
  serializeInquiryDetail,
  serializeInquirySummary,
} from "../../utils/serializers.js";

export function createAdminInquiriesRouter({
  repository = defaultRepository,
} = {}) {
  const router = Router();

  router.get("/", validate({ query: inquiryListQuerySchema }), async (req, res) => {
    const query = req.validated.query;
    const { items, total } = await repository.list(query);

    sendPaginated(
      res,
      { items: items.map(serializeInquirySummary) },
      paginationMeta({ page: query.page, limit: query.limit, total }),
    );
  });

  router.get(
    "/:id",
    validate({ params: inquiryIdParamsSchema }),
    async (req, res) => {
      const inquiry = await repository.findById(req.validated.params.id);
      if (!inquiry) throw notFoundError("Inquiry not found.");
      sendSuccess(res, { inquiry: serializeInquiryDetail(inquiry) });
    },
  );

  router.patch(
    "/:id",
    validate({ params: inquiryIdParamsSchema, body: updateInquirySchema }),
    async (req, res) => {
      const { id } = req.validated.params;
      const { status } = req.validated.body;

      const current = await repository.findById(id);
      if (!current) throw notFoundError("Inquiry not found.");

      const allowed = INQUIRY_STATUS_TRANSITIONS[current.status] ?? [];
      if (!allowed.includes(status)) {
        throw new HttpError(
          409,
          "INVALID_STATUS_TRANSITION",
          `An inquiry in ${current.status} cannot move to ${status}.`,
        );
      }

      const updated = await repository.updateStatus({
        id,
        fromStatus: current.status,
        status,
        changedBy: req.auth.user.id,
      });
      if (!updated) {
        throw new HttpError(
          409,
          "STATUS_CHANGED",
          "This inquiry was updated by someone else. Reload and try again.",
        );
      }

      sendSuccess(res, { inquiry: serializeInquiryDetail(updated) });
    },
  );

  return router;
}

export default createAdminInquiriesRouter;
