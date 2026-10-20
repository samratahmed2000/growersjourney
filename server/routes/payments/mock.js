import express, { Router } from "express";
import { minorAmountToDecimalString } from "../../utils/money.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function page({ title, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #f4f7f5; color: #123c2d; font-family: system-ui, -apple-system, Segoe UI, sans-serif; }
    main { width: 100%; max-width: 30rem; background: #fff; border: 1px solid #d9e5dc; border-radius: 18px; padding: 28px; box-shadow: 0 20px 50px rgba(18,60,45,.08); }
    .tag { display: inline-block; margin-bottom: 16px; padding: 4px 9px; border-radius: 999px; background: #fff4d6; color: #6b4b00; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
    h1 { margin: 0 0 8px; font-size: 1.45rem; }
    p { line-height: 1.6; color: #4a6156; }
    .amount { margin: 20px 0; font-size: 2rem; font-weight: 800; letter-spacing: -.03em; }
    .actions { display: grid; gap: 10px; margin-top: 24px; }
    button { width: 100%; border: 0; border-radius: 10px; padding: 13px 16px; font: inherit; font-weight: 700; cursor: pointer; }
    .success { background: #0f7048; color: #fff; }
    .failure { background: #fff; color: #123c2d; border: 1px solid #b9cdc0; }
    .cancel { background: transparent; color: #5b6f64; border: 0; text-decoration: underline; }
    a { color: #0f7048; font-weight: 700; }
    .note { font-size: .85rem; color: #6b7d72; margin-top: 22px; }
  </style>
</head>
<body>
  <main>${body}</main>
</body>
</html>`;
}

function resultPage({ payment, token, paymentId }) {
  const amount = `${minorAmountToDecimalString(payment.amountMinor, payment.currency)} ${payment.currency}`;
  return page({
    title: "Mock payment checkout",
    body: `
      <span class="tag">Test mode — no real money</span>
      <h1>Mock payment checkout</h1>
      <p>Invoice ${escapeHtml(payment.invoiceNumber ?? "draft")} · Payment ${escapeHtml(paymentId)}</p>
      <div class="amount">${escapeHtml(amount)}</div>
      <p>This page is provided by the local FAKE payment adapter. Choosing an outcome emits a signed, server-verified event through the same payment pipeline used by a real provider.</p>
      <div class="actions">
        <form method="post" action="/api/v1/payments/mock/complete">
          <input type="hidden" name="paymentId" value="${escapeHtml(paymentId)}">
          <input type="hidden" name="token" value="${escapeHtml(token)}">
          <input type="hidden" name="outcome" value="success">
          <button class="success" type="submit">Simulate successful payment</button>
        </form>
        <form method="post" action="/api/v1/payments/mock/complete">
          <input type="hidden" name="paymentId" value="${escapeHtml(paymentId)}">
          <input type="hidden" name="token" value="${escapeHtml(token)}">
          <input type="hidden" name="outcome" value="failure">
          <button class="failure" type="submit">Simulate failed payment</button>
        </form>
        <form method="post" action="/api/v1/payments/mock/complete">
          <input type="hidden" name="paymentId" value="${escapeHtml(paymentId)}">
          <input type="hidden" name="token" value="${escapeHtml(token)}">
          <input type="hidden" name="outcome" value="cancel">
          <button class="cancel" type="submit">Cancel</button>
        </form>
      </div>
      <p class="note">Test-only page. It is not mounted when PAYMENT_PROVIDER is not FAKE or when NODE_ENV=production.</p>
    `,
  });
}

function errorPage({ title, message }) {
  return page({
    title,
    body: `
      <span class="tag">Mock payment</span>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      <p><a href="/">Return to the site</a></p>
    `,
  });
}

export function createMockPaymentRouter({ paymentService, provider } = {}) {
  if (!paymentService || !provider) {
    throw new Error("Mock payment service and provider are required.");
  }
  if (provider.name !== "FAKE") {
    throw new Error("The mock payment router is only available for the FAKE provider.");
  }

  const router = Router();

  router.use((req, res, next) => {
    res.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
    res.set("X-Robots-Tag", "noindex, nofollow");
    next();
  });

  router.get("/checkout/:paymentId", async (req, res) => {
    try {
      const payment = await paymentService.getMockCheckout({
        paymentId: req.params.paymentId,
        token: req.query.token,
      });
      if (!payment.isPayable) {
        res.status(409).send(
          errorPage({
            title: "Payment is no longer pending",
            message: `This mock payment is currently ${payment.status}. Start a new payment from the invoice.`,
          }),
        );
        return;
      }
      res.type("html").send(
        resultPage({
          payment,
          token: req.query.token,
          paymentId: req.params.paymentId,
        }),
      );
    } catch {
      res.status(400).send(
        errorPage({
          title: "Invalid mock payment link",
          message: "This checkout link is invalid or has expired. Start a new payment from the invoice.",
        }),
      );
    }
  });

  router.post(
    "/complete",
    express.urlencoded({ extended: false, limit: "32kb" }),
    async (req, res) => {
      const { paymentId, token, outcome } = req.body ?? {};
      if (!["success", "failure", "cancel"].includes(outcome)) {
        res.status(400).send(
          errorPage({
            title: "Invalid mock outcome",
            message: "Choose a valid mock payment outcome.",
          }),
        );
        return;
      }

      try {
        await paymentService.completeMockPayment({
          paymentId,
          token,
          outcome,
          requestId: req.id,
        });
        res.redirect(
          303,
          `${paymentService.config.frontendUrl}/portal/payments/${encodeURIComponent(
            paymentId,
          )}?mock=1`,
        );
      } catch {
        res.status(400).send(
          errorPage({
            title: "Mock payment could not be completed",
            message: "Return to the invoice and start a new payment attempt.",
          }),
        );
      }
    },
  );

  return router;
}

export default createMockPaymentRouter;
