import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { requestId } from "../middleware/request-id.js";
import { errorHandler } from "../middleware/error-handler.js";
import { notFound } from "../middleware/not-found.js";
import { sendSuccess } from "../utils/api-response.js";

/**
 * Validation middleware tests. No production route accepts input yet, so the
 * middleware is exercised through a throwaway app — the same pattern the real
 * routes will use:
 *
 *   router.post("/things", validate({ body: thingSchema }), handler);
 */

const SECRET_MARKER = "SUPER_SECRET_MARKER_9f3a1c";

const thingSchema = z.object({
  name: z.string().min(2),
  age: z.number().int().positive(),
});

function startValidationApp() {
  const app = express();
  app.use(requestId);
  app.use(express.json());

  app.post(
    "/things",
    validate({ body: thingSchema }),
    (req, res) => sendSuccess(res, req.validated.body, 201),
  );

  app.use(notFound);
  app.use(errorHandler);

  const server = app.listen(0);
  const ready = new Promise((resolve) => server.once("listening", resolve));

  return {
    async baseUrl() {
      await ready;
      return `http://127.0.0.1:${server.address().port}`;
    },
    async close() {
      if (typeof server.closeAllConnections === "function") {
        server.closeAllConnections();
      }
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

test("valid input is parsed and exposed on req.validated", async (t) => {
  const app = startValidationApp();
  t.after(() => app.close());

  const res = await fetch(`${await app.baseUrl()}/things`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Ada", age: 30 }),
  });

  assert.equal(res.status, 201);
  assert.deepEqual(await res.json(), {
    success: true,
    data: { name: "Ada", age: 30 },
  });
});

test("unknown fields are stripped instead of being forwarded", async (t) => {
  const app = startValidationApp();
  t.after(() => app.close());

  const res = await fetch(`${await app.baseUrl()}/things`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Ada", age: 30, role: "ADMIN", isAdmin: true }),
  });

  assert.equal(res.status, 201);
  // Privileged/unknown fields must not survive validation.
  assert.deepEqual(await res.json(), {
    success: true,
    data: { name: "Ada", age: 30 },
  });
});

test("invalid input returns 400 VALIDATION_ERROR with field-level details", async (t) => {
  const app = startValidationApp();
  t.after(() => app.close());

  const res = await fetch(`${await app.baseUrl()}/things`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "A", age: -5 }),
  });

  assert.equal(res.status, 400);

  const body = await res.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "VALIDATION_ERROR");
  assert.equal(body.error.message, "Please check the submitted information.");

  const fields = body.error.details.map((detail) => detail.field).sort();
  assert.deepEqual(fields, ["body.age", "body.name"]);
  for (const detail of body.error.details) {
    assert.equal(typeof detail.message, "string");
    assert.ok(detail.message.length > 0);
  }
});

test("validation details never echo the submitted value back", async (t) => {
  const app = startValidationApp();
  t.after(() => app.close());

  const res = await fetch(`${await app.baseUrl()}/things`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: SECRET_MARKER, age: "not-a-number" }),
  });

  const text = await res.text();

  assert.equal(res.status, 400);
  assert.doesNotMatch(text, new RegExp(SECRET_MARKER));
});

test("a missing body is rejected rather than treated as valid", async (t) => {
  const app = startValidationApp();
  t.after(() => app.close());

  const res = await fetch(`${await app.baseUrl()}/things`, { method: "POST" });

  assert.equal(res.status, 400);
  assert.equal((await res.json()).error.code, "VALIDATION_ERROR");
});
