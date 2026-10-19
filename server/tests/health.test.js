import test from "node:test";
import assert from "node:assert/strict";
import { startTestServer } from "./helpers/server.js";

/**
 * Success-path tests. These run without a database: the liveness endpoint must
 * not depend on MongoDB, and readiness must degrade safely.
 */

test("GET /api/v1/health returns the documented liveness envelope", async (t) => {
  const app = await startTestServer();
  t.after(() => app.close());

  const res = await fetch(`${app.baseUrl}/api/v1/health`);

  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /application\/json/);
  assert.deepEqual(await res.json(), {
    success: true,
    data: { status: "ok" },
  });
});

test("GET /api/v1/health/ready reports 503 when no database is connected", async (t) => {
  const app = await startTestServer();
  t.after(() => app.close());

  const res = await fetch(`${app.baseUrl}/api/v1/health/ready`);

  assert.equal(res.status, 503);

  const body = await res.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, "DATABASE_UNAVAILABLE");
  assert.equal(body.error.message, "The database is not reachable.");
  // Only the connection state is exposed, never the URI, host, or credentials.
  assert.deepEqual(body.error.details, [{ database: "disconnected" }]);
});

test("GET / returns the plain-text boot probe", async (t) => {
  const app = await startTestServer();
  t.after(() => app.close());

  const res = await fetch(`${app.baseUrl}/`);

  assert.equal(res.status, 200);
  assert.equal(await res.text(), "Server is running");
});

test("every response carries a generated x-request-id header", async (t) => {
  const app = await startTestServer();
  t.after(() => app.close());

  const res = await fetch(`${app.baseUrl}/api/v1/health`);

  const id = res.headers.get("x-request-id");
  assert.ok(id, "expected an x-request-id response header");
  assert.match(id, /^[0-9a-f-]{36}$/);
});

test("x-powered-by is not advertised", async (t) => {
  const app = await startTestServer();
  t.after(() => app.close());

  const res = await fetch(`${app.baseUrl}/api/v1/health`);

  assert.equal(res.headers.get("x-powered-by"), null);
});
