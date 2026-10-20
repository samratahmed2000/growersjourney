import { Router } from "express";
import { sendPaginated, sendSuccess } from "../../utils/api-response.js";
import { validate } from "../../middleware/validate.js";
import {
  paymentSessionSchema,
  portalInvoiceListQuerySchema,
  portalInvoiceParamsSchema,
} from "../../validators/portal/invoice.js";
import { paginationMeta } from "../../validators/admin/common.js";

/**
 * Client portal invoice API. The resolved `req.portal.client` is the only
 * ownership source; no client id is accepted from the browser.
 */
export function createPortalInvoicesRouter({
  invoiceService,
  paymentService,
} = {}) {
  if (!invoiceService || !paymentService) {
    throw new Error("Portal invoice services are required.");
  }

  const router = Router();

  router.get(
    "/",
    validate({ query: portalInvoiceListQuerySchema }),
    async (req, res) => {
      const query = req.validated.query;
      const clientId = req.portal.client.id;
      const { items, total } = await invoiceService.listForClient({
        clientId,
        query,
      });

      sendPaginated(
        res,
        { items },
        paginationMeta({ page: query.page, limit: query.limit, total }),
      );
    },
  );

  router.get(
    "/:id",
    validate({ params: portalInvoiceParamsSchema }),
    async (req, res) => {
      const clientId = req.portal.client.id;
      const invoice = await invoiceService.getForClient({
        id: req.validated.params.id,
        clientId,
      });
      const payments = await paymentService.listForClientInvoice({
        invoiceId: req.validated.params.id,
        clientId,
      });

      sendSuccess(res, { invoice, payments });
    },
  );

  router.post(
    "/:id/payment-session",
    validate({
      params: portalInvoiceParamsSchema,
      body: paymentSessionSchema,
    }),
    async (req, res) => {
      const result = await paymentService.createSession({
        invoiceId: req.validated.params.id,
        clientId: req.portal.client.id,
        amountMinor: req.validated.body.amountMinor,
        idempotencyKey: req.validated.body.idempotencyKey,
        user: req.auth.user,
        requestId: req.id,
      });
      sendSuccess(res, result, 201);
    },
  );

  return router;
}

export default createPortalInvoicesRouter;
