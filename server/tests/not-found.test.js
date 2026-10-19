import test from "node:test";
import assert from "node:assert/strict";
import { startTestServer } from "./helpers/server.js";

/** Missing-route tests: unknown routes must return the JSON envelope, never HTML. */

test("unknown API route returns the JSON 404 envelope", async (t) => {
  const app = await startTestServer();
  t.after(() => app.close());

  const res = await fetch(`${app.baseUrl}/api/v1/does-not-exist`);

  assert.equal(res.status, 404);
  assert.match(res.headers.get("content-type") ?? "", /application\/json/);
  assert.deepEqual(await res.json(), {
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested resource was not found.",
    },
  });
});

test("unknown non-API route also returns JSON and never an HTML page", async (t) => {
  const app = await startTestServer();
  t.after(() => app.close());

  const res = await fetch(`${app.baseUrl}/nope`);
  const text = await res.text();

  assert.equal(res.status, 404);
  assert.doesNotMatch(text, /<html/i);
  assert.doesNotMatch(text, /<!doctype/i);
  assert.equal(JSON.parse(text).error.code, "NOT_FOUND");
});

test("a wrong HTTP method on an existing path is treated as not found", async (t) => {
  const app = await startTestServer();
  t.after(() => app.close());

  const res = await fetch(`${app.baseUrl}/api/v1/health`, { method: "DELETE" });

  assert.equal(res.status, 404);
  assert.equal((await res.json()).error.code, "NOT_FOUND");
});
