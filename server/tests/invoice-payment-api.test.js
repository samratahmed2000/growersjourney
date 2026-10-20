import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { IDS } from "./helpers/admin.js";
import {
  addSecondClient,
  linkClientUser,
  startPortalTestServer,
} from "./helpers/portal.js";
import { createSignedInUser, jsonRequest } from "./helpers/admin.js";
import { createFakeFinance, PAYMENT_SECRET } from "./helpers/finance.js";

function sign(rawBody) {
  return crypto.createHmac("sha256", PAYMENT_SECRET).update(rawBody).digest("hex");
}

async function postWebhook(baseUrl, event) {
  const rawBody = JSON.stringify(event);
  const response = await fetch(`${baseUrl}/api/v1/webhooks/payments/fake`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-payment-signature": sign(rawBody),
    },
    body: rawBody,
  });
  return { response, json: await response.json().catch(() => null) };
}

async function createInvoice({
  server,
  cookie,
  clientId = IDS.client,
  projectId = IDS.project,
  amountMinor = 15000,
  quantity = "1",
  dueDate = "2030-12-31",
}) {
  const created = await jsonRequest(server.baseUrl, "/api/v1/admin/invoices", {
    method: "POST",
    cookie,
    body: {
      clientId,
      projectId,
      currency: "BDT",
      lineItems: [
        { description: "Consulting", quantity, unitAmountMinor: amountMinor },
      ],
      dueDate,
    },
  });
  assert.equal(created.response.status, 201, JSON.stringify(created.json));
  return created.json.data.invoice;
}

async function issueInvoice({ server, cookie, id }) {
  const response = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/invoices/${id}/issue`,
    { method: "POST", cookie },
  );
  assert.equal(response.response.status, 200, JSON.stringify(response.json));
  return response.json.data.invoice;
}

async function startPayment({ server, cookie, invoiceId, amountMinor }) {
  const response = await jsonRequest(
    server.baseUrl,
    `/api/v1/portal/invoices/${invoiceId}/payment-session`,
    {
      method: "POST",
      cookie,
      body: amountMinor === undefined ? {} : { amountMinor },
    },
  );
  assert.equal(response.response.status, 201, JSON.stringify(response.json));
  return response.json.data;
}

function succeededEvent(payment, overrides = {}) {
  return {
    eventId: `event-${payment.id}-success`,
    eventType: "payment.updated",
    paymentId: payment.id,
    status: "SUCCEEDED",
    amountMinor: payment.amountMinor,
    currency: payment.currency,
    providerPaymentId: `PROVIDER-${payment.id}`,
    paymentMethod: "MOCK",
    ...overrides,
  };
}

test("admin and client invoice flow is server-calculated and provider-verified", async (t) => {
  const server = await startPortalTestServer({
    financeFactory: ({ repositories, data }) =>
      createFakeFinance({ repositories, data }).finance,
  });
  t.after(() => server.close());

  const admin = await createSignedInUser(server, "ADMIN");
  const portal = await linkClientUser({
    app: server,
    auth: server.auth,
    data: server.data,
  });

  const draft = await createInvoice({ server, cookie: admin.cookie });
  assert.equal(draft.status, "DRAFT");
  assert.equal(draft.totalMinor, 15000);
  assert.equal(draft.balanceDueMinor, 15000);

  const draftRead = await jsonRequest(
    server.baseUrl,
    `/api/v1/portal/invoices/${draft.id}`,
    { cookie: portal.cookie },
  );
  assert.equal(draftRead.response.status, 404);

  const issued = await issueInvoice({ server, cookie: admin.cookie, id: draft.id });
  assert.equal(issued.status, "ISSUED");
  assert.match(issued.invoiceNumber, /^INV-\d{4}-000001$/);
  assert.equal(issued.totalMinor, 15000);

  const listed = await jsonRequest(server.baseUrl, "/api/v1/portal/invoices", {
    cookie: portal.cookie,
  });
  assert.equal(listed.response.status, 200);
  assert.equal(listed.json.data.items.length, 1);
  assert.equal(listed.json.data.items[0].id, issued.id);
  assert.equal(listed.json.data.items[0].project.name, "Test Project");

  const forbidden = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/invoices/${issued.id}`,
    { cookie: portal.cookie },
  );
  assert.equal(forbidden.response.status, 403);

  const crossSitePayment = await jsonRequest(
    server.baseUrl,
    `/api/v1/portal/invoices/${issued.id}/payment-session`,
    {
      method: "POST",
      cookie: portal.cookie,
      origin: "https://evil.example",
      body: {},
    },
  );
  assert.equal(crossSitePayment.response.status, 403);
  assert.equal(crossSitePayment.json.error.code, "INVALID_ORIGIN");

  const paymentResult = await startPayment({
    server,
    cookie: portal.cookie,
    invoiceId: issued.id,
  });
  assert.equal(paymentResult.payment.status, "PENDING");
  assert.match(paymentResult.checkoutUrl, /\/api\/v1\/payments\/mock\/checkout\//);
  assert.equal(paymentResult.payment.providerTransactionId, undefined);
  assert.equal(paymentResult.payment.safeFailureCode, undefined);

  const event = succeededEvent(paymentResult.payment);
  const webhook = await postWebhook(server.baseUrl, event);
  assert.equal(webhook.response.status, 200, JSON.stringify(webhook.json));
  assert.equal(webhook.json.data.processed, true);

  const detail = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/invoices/${issued.id}`,
    { cookie: admin.cookie },
  );
  assert.equal(detail.response.status, 200);
  assert.equal(detail.json.data.invoice.status, "PAID");
  assert.equal(detail.json.data.invoice.amountPaidMinor, 15000);
  assert.equal(detail.json.data.invoice.balanceDueMinor, 0);

  const duplicate = await postWebhook(server.baseUrl, event);
  assert.equal(duplicate.response.status, 200);
  assert.equal(duplicate.json.data.duplicate, true);

  const afterDuplicate = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/invoices/${issued.id}`,
    { cookie: admin.cookie },
  );
  assert.equal(afterDuplicate.json.data.invoice.amountPaidMinor, 15000);

  const mismatch = await postWebhook(server.baseUrl, {
    ...event,
    eventId: "event-mismatch",
    amountMinor: 1,
  });
  assert.equal(mismatch.response.status, 200);
  assert.equal(mismatch.json.data.processed, false);

  const afterMismatch = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/invoices/${issued.id}`,
    { cookie: admin.cookie },
  );
  assert.equal(afterMismatch.json.data.invoice.amountPaidMinor, 15000);

  const invalidSignature = await fetch(
    `${server.baseUrl}/api/v1/webhooks/payments/fake`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-payment-signature": "not-a-valid-signature",
      },
      body: JSON.stringify({ ...event, eventId: "bad-signature" }),
    },
  );
  assert.equal(invalidSignature.status, 400);

  const portalInvoice = await jsonRequest(
    server.baseUrl,
    `/api/v1/portal/invoices/${issued.id}`,
    { cookie: portal.cookie },
  );
  assert.equal(portalInvoice.response.status, 200);
  assert.equal(portalInvoice.json.data.invoice.status, "PAID");
  assert.equal(portalInvoice.json.data.invoice.client.displayName, "Test Client");
  assert.ok(portalInvoice.json.data.invoice.project.name);
  assert.equal(portalInvoice.json.data.invoice.internalNotes, undefined);
  assert.equal(portalInvoice.json.data.invoice.allowedActions, undefined);
  assert.equal(portalInvoice.json.data.invoice.voidReason, undefined);
  assert.equal(portalInvoice.json.data.payments[0].status, "SUCCEEDED");
  assert.equal(portalInvoice.json.data.invoice.canPay, false);
});

test("partial payments, refunds, and void rules use the verified ledger", async (t) => {
  let built;
  const server = await startPortalTestServer({
    financeFactory: ({ repositories, data }) => {
      built = createFakeFinance({ repositories, data });
      return built.finance;
    },
  });
  t.after(() => server.close());

  const admin = await createSignedInUser(server, "ADMIN");
  const portal = await linkClientUser({
    app: server,
    auth: server.auth,
    data: server.data,
  });

  const draft = await createInvoice({ server, cookie: admin.cookie, amountMinor: 15000 });
  const issued = await issueInvoice({ server, cookie: admin.cookie, id: draft.id });

  const partial = await startPayment({
    server,
    cookie: portal.cookie,
    invoiceId: issued.id,
    amountMinor: 5000,
  });
  const partialWebhook = await postWebhook(
    server.baseUrl,
    succeededEvent(partial.payment),
  );
  assert.equal(partialWebhook.json.data.processed, true);

  const afterPartial = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/invoices/${issued.id}`,
    { cookie: admin.cookie },
  );
  assert.equal(afterPartial.json.data.invoice.status, "PARTIALLY_PAID");
  assert.equal(afterPartial.json.data.invoice.balanceDueMinor, 10000);

  const overpay = await jsonRequest(
    server.baseUrl,
    `/api/v1/portal/invoices/${issued.id}/payment-session`,
    {
      method: "POST",
      cookie: portal.cookie,
      body: { amountMinor: 10001 },
    },
  );
  assert.equal(overpay.response.status, 400);

  const voidWithPayment = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/invoices/${issued.id}/void`,
    {
      method: "POST",
      cookie: admin.cookie,
      body: { reason: "Client requested cancellation" },
    },
  );
  assert.equal(voidWithPayment.response.status, 409);
  assert.equal(voidWithPayment.json.error.code, "INVOICE_HAS_PAYMENTS");

  const overRefund = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/payments/${partial.payment.id}/refund`,
    {
      method: "POST",
      cookie: admin.cookie,
      body: { amountMinor: 5001, reason: "Too much" },
    },
  );
  assert.equal(overRefund.response.status, 400);

  const refund = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/payments/${partial.payment.id}/refund`,
    {
      method: "POST",
      cookie: admin.cookie,
      body: { amountMinor: 5000, reason: "Duplicate charge" },
    },
  );
  assert.equal(refund.response.status, 200, JSON.stringify(refund.json));
  assert.equal(refund.json.data.payment.status, "REFUNDED");

  const afterRefund = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/invoices/${issued.id}`,
    { cookie: admin.cookie },
  );
  assert.equal(afterRefund.json.data.invoice.status, "ISSUED");
  assert.equal(afterRefund.json.data.invoice.amountRefundedMinor, 5000);
  assert.equal(afterRefund.json.data.invoice.balanceDueMinor, 15000);

  const voided = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/invoices/${issued.id}/void`,
    {
      method: "POST",
      cookie: admin.cookie,
      body: { reason: "Client requested cancellation" },
    },
  );
  assert.equal(voided.response.status, 200, JSON.stringify(voided.json));
  assert.equal(voided.json.data.invoice.status, "VOID");
});

test("cross-client invoices and payment attempts are concealed", async (t) => {
  const server = await startPortalTestServer({
    financeFactory: ({ repositories, data }) => createFakeFinance({ repositories, data }).finance,
  });
  t.after(() => server.close());

  const admin = await createSignedInUser(server, "ADMIN");
  const firstPortal = await linkClientUser({
    app: server,
    auth: server.auth,
    data: server.data,
  });
  const second = addSecondClient(server.data);
  const secondPortal = await linkClientUser({
    app: server,
    auth: server.auth,
    data: server.data,
    client: second.client,
  });

  const secondDraft = await createInvoice({
    server,
    cookie: admin.cookie,
    clientId: second.client._id,
    projectId: second.project._id,
  });
  const secondIssued = await issueInvoice({
    server,
    cookie: admin.cookie,
    id: secondDraft.id,
  });

  const read = await jsonRequest(
    server.baseUrl,
    `/api/v1/portal/invoices/${secondIssued.id}`,
    { cookie: firstPortal.cookie },
  );
  assert.equal(read.response.status, 404);

  const pay = await jsonRequest(
    server.baseUrl,
    `/api/v1/portal/invoices/${secondIssued.id}/payment-session`,
    { method: "POST", cookie: firstPortal.cookie, body: {} },
  );
  assert.equal(pay.response.status, 404);

  const secondRead = await jsonRequest(
    server.baseUrl,
    `/api/v1/portal/invoices/${secondIssued.id}`,
    { cookie: secondPortal.cookie },
  );
  assert.equal(secondRead.response.status, 200);
});

test("a duplicate webhook delivered concurrently credits the invoice once", async (t) => {
  let built;
  const server = await startPortalTestServer({
    financeFactory: ({ repositories, data }) => {
      built = createFakeFinance({ repositories, data });
      return built.finance;
    },
  });
  t.after(() => server.close());

  const admin = await createSignedInUser(server, "ADMIN");
  const portal = await linkClientUser({
    app: server,
    auth: server.auth,
    data: server.data,
  });
  const draft = await createInvoice({ server, cookie: admin.cookie });
  const issued = await issueInvoice({ server, cookie: admin.cookie, id: draft.id });
  const session = await startPayment({
    server,
    cookie: portal.cookie,
    invoiceId: issued.id,
  });
  const event = succeededEvent(session.payment);

  const [first, second] = await Promise.all([
    postWebhook(server.baseUrl, event),
    postWebhook(server.baseUrl, event),
  ]);
  assert.equal(first.response.status, 200);
  assert.equal(second.response.status, 200);

  const detail = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/invoices/${issued.id}`,
    { cookie: admin.cookie },
  );
  assert.equal(detail.json.data.invoice.amountPaidMinor, 15000);
  assert.equal(detail.json.data.invoice.status, "PAID");
  assert.equal(built.stores.events.filter((item) => item.eventId === event.eventId).length, 1);
});
