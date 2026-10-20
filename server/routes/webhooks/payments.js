import express, { Router } from "express";
import { sendSuccess } from "../../utils/api-response.js";

/**
 * Payment provider webhooks.
 *
 * Mounted BEFORE express.json() so the raw body survives signature
 * verification. Never trust a webhook because it reached this URL: the provider
 * adapter verifies the signature and the payment service re-checks the amount,
 * currency, payment reference, and idempotency ledger.
 */
export function createPaymentWebhookRouter({ paymentService } = {}) {
  if (!paymentService) throw new Error("Payment webhook service is required.");

  const router = Router();

  router.post(
    "/:provider",
    express.raw({ type: "*/*", limit: "1mb" }),
    async (req, res) => {
      res.set("Cache-Control", "no-store");
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body.toString("utf8")
        : String(req.body ?? "");

      const result = await paymentService.processWebhook({
        providerName: req.params.provider,
        rawBody,
        headers: req.headers,
        requestId: req.id,
      });

      sendSuccess(res, {
        received: true,
        processed: Boolean(result.processed),
        duplicate: Boolean(result.duplicate),
      });
    },
  );

  return router;
}

export default createPaymentWebhookRouter;
