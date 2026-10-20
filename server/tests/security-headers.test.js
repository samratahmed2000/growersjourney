import test from "node:test";
import assert from "node:assert/strict";
import { startTestServer } from "./helpers/server.js";

test("every API response carries baseline security headers", async (t) => {
  const server = await startTestServer({ securityHsts: true });
  t.after(() => server.close());

  const response = await fetch(`${server.baseUrl}/api/v1/health`);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(
    response.headers.get("referrer-policy"),
    "strict-origin-when-cross-origin",
  );
  assert.match(
    response.headers.get("permissions-policy") ?? "",
    /camera=\(\)/,
  );
  assert.equal(
    response.headers.get("strict-transport-security"),
    "max-age=31536000",
  );
  assert.equal(response.headers.get("x-powered-by"), null);
});

test("HSTS is omitted when the app is not told it is served over HTTPS", async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const response = await fetch(`${server.baseUrl}/api/v1/health`);
  assert.equal(response.headers.get("strict-transport-security"), null);
});
