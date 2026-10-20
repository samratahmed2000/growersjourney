import { Router } from "express";
import { sendPaginated, sendSuccess } from "../../utils/api-response.js";
import { validate } from "../../middleware/validate.js";
import {
  createInvoiceSchema,
  invoiceListQuerySchema,
  invoiceParamsSchema,
  updateInvoiceSchema,
  voidInvoiceSchema,
} from "../../validators/admin/invoice.js";
import { paginationMeta } from "../../validators/admin/common.js";

/**
 * Admin invoice API.
 *
 * There is deliberately no generic "set status" or "set amount paid" endpoint.
 * Status is changed only by issue, void, or provider-verified payments.
 */
export function createAdminInvoicesRouter({ service } = {}) {
  if (!service) throw new Error("Admin invoice service is required.");

  const router = Router();

  router.get("/", validate({ query: invoiceListQuerySchema }), async (req, res) => {
    const query = req.validated.query;
    const { items, total } = await service.list(query);

    sendPaginated(
      res,
      { items },
      paginationMeta({ page: query.page, limit: query.limit, total }),
    );
  });

  router.post("/", validate({ body: createInvoiceSchema }), async (req, res) => {
    const invoice = await service.createDraft({
      data: req.validated.body,
      actorUserId: req.auth.user.id,
      requestId: req.id,
    });
    sendSuccess(res, { invoice }, 201);
  });

  router.get(
    "/:id",
    validate({ params: invoiceParamsSchema }),
    async (req, res) => {
      const invoice = await service.getById(req.validated.params.id);
      sendSuccess(res, { invoice });
    },
  );

  router.patch(
    "/:id",
    validate({ params: invoiceParamsSchema, body: updateInvoiceSchema }),
    async (req, res) => {
      const invoice = await service.updateDraft({
        id: req.validated.params.id,
        data: req.validated.body,
        actorUserId: req.auth.user.id,
        requestId: req.id,
      });
      sendSuccess(res, { invoice });
    },
  );

  router.post(
    "/:id/issue",
    validate({ params: invoiceParamsSchema }),
    async (req, res) => {
      const invoice = await service.issue({
        id: req.validated.params.id,
        actorUserId: req.auth.user.id,
        requestId: req.id,
      });
      sendSuccess(res, { invoice });
    },
  );

  router.post(
    "/:id/void",
    validate({ params: invoiceParamsSchema, body: voidInvoiceSchema }),
    async (req, res) => {
      const invoice = await service.void({
        id: req.validated.params.id,
        reason: req.validated.body.reason,
        actorUserId: req.auth.user.id,
        requestId: req.id,
      });
      sendSuccess(res, { invoice });
    },
  );

  return router;
}

export default createAdminInvoicesRouter;
