import { Router } from "express";
import { sendPaginated, sendSuccess } from "../../utils/api-response.js";
import { validate } from "../../middleware/validate.js";
import {
  paymentListQuerySchema,
  paymentParamsSchema,
  paymentRefundSchema,
} from "../../validators/admin/payment.js";
import { paginationMeta } from "../../validators/admin/common.js";

/**
 * Admin payment ledger API. It can read verified attempts and request a
 * provider-confirmed refund; it cannot mark a payment successful.
 */
export function createAdminPaymentsRouter({ service } = {}) {
  if (!service) throw new Error("Admin payment service is required.");

  const router = Router();

  router.get("/", validate({ query: paymentListQuerySchema }), async (req, res) => {
    const query = req.validated.query;
    const { items, total } = await service.list(query);

    sendPaginated(
      res,
      { items },
      paginationMeta({ page: query.page, limit: query.limit, total }),
    );
  });

  router.get(
    "/:id",
    validate({ params: paymentParamsSchema }),
    async (req, res) => {
      const payment = await service.getById(req.validated.params.id);
      sendSuccess(res, { payment });
    },
  );

  router.post(
    "/:id/refund",
    validate({ params: paymentParamsSchema, body: paymentRefundSchema }),
    async (req, res) => {
      const result = await service.refund({
        paymentId: req.validated.params.id,
        amountMinor: req.validated.body.amountMinor,
        reason: req.validated.body.reason,
        actorUserId: req.auth.user.id,
        requestId: req.id,
      });
      sendSuccess(res, result);
    },
  );

  router.post(
    "/:id/reconcile",
    validate({ params: paymentParamsSchema }),
    async (req, res) => {
      const result = await service.reconcile({
        paymentId: req.validated.params.id,
        requestId: req.id,
      });
      sendSuccess(res, result);
    },
  );

  return router;
}

export default createAdminPaymentsRouter;
