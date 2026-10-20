import { Router } from "express";
import { sendSuccess } from "../../utils/api-response.js";
import { validate } from "../../middleware/validate.js";
import { portalPaymentParamsSchema } from "../../validators/portal/invoice.js";

/** Portal payment attempt lookup. Ownership is resolved by the middleware. */
export function createPortalPaymentsRouter({ paymentService } = {}) {
  if (!paymentService) throw new Error("Portal payment service is required.");

  const router = Router();

  router.get(
    "/:id",
    validate({ params: portalPaymentParamsSchema }),
    async (req, res) => {
      const payment = await paymentService.getForClient({
        id: req.validated.params.id,
        clientId: req.portal.client.id,
      });
      sendSuccess(res, { payment });
    },
  );

  return router;
}

export default createPortalPaymentsRouter;
