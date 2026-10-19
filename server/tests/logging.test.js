import test from "node:test";
import assert from "node:assert/strict";
import { startTestServer } from "./helpers/server.js";

/**
 * Logging safety test.
 *
 * The logger must never write request bodies, headers, authorization values, or
 * query strings. This test sends all of those containing the same marker and
 * asserts the marker never appears in any log output.
 */

const SECRET_MARKER = "SUPER_SECRET_MARKER_9f3a1c";

function captureConsole(t) {
  const lines = [];
  const originals = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  for (const level of Object.keys(originals)) {
    console[level] = (...args) => lines.push(args.join(" "));
  }

  t.after(() => {
    console.log = originals.log;
    console.warn = originals.warn;
    console.error = originals.error;
  });

  return () => lines.join("\n");
}

test("request logs exclude bodies, headers, and query strings", async (t) => {
  const readLogs = captureConsole(t);
  const app = await startTestServer({ logRequests: true });
  t.after(() => app.close());

  await fetch(`${app.baseUrl}/api/v1/health?token=${SECRET_MARKER}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${SECRET_MARKER}`,
      cookie: `session=${SECRET_MARKER}`,
    },
    body: JSON.stringify({ password: SECRET_MARKER }),
  });

  // Allow the "finish" handler to run before reading the captured output.
  await new Promise((resolve) => setTimeout(resolve, 100));

  const logs = readLogs();

  assert.match(logs, /\[req\]/, "expected a request log line");
  assert.doesNotMatch(logs, new RegExp(SECRET_MARKER), `log leaked a secret:\n${logs}`);
  assert.doesNotMatch(logs, /Bearer/, "authorization header leaked into the log");
});

test("the logged path is the full path, including the /api/v1 mount prefix", async (t) => {
  // Regression guard: Express strips the mount prefix from `req.path` while a
  // mounted router handles the request, which previously made the log read
  // "GET /health" instead of "GET /api/v1/health".
  const readLogs = captureConsole(t);
  const app = await startTestServer({ logRequests: true });
  t.after(() => app.close());

  await fetch(`${app.baseUrl}/api/v1/health`);
  await new Promise((resolve) => setTimeout(resolve, 100));

  const logs = readLogs();

  assert.match(logs, /\[req\] .* GET \/api\/v1\/health 200 /);
  assert.doesNotMatch(logs, /GET \/health 200/, "mount prefix was stripped from the log path");
});

test("a 404 is logged with the path only, not the query string", async (t) => {
  const readLogs = captureConsole(t);
  const app = await startTestServer({ logRequests: true });
  t.after(() => app.close());

  await fetch(`${app.baseUrl}/api/v1/missing?token=${SECRET_MARKER}`);
  await new Promise((resolve) => setTimeout(resolve, 100));

  const logs = readLogs();

  assert.match(logs, /\[req\] .* POST|GET \/api\/v1\/missing 404/);
  assert.doesNotMatch(logs, new RegExp(SECRET_MARKER));
});

test("logging can be disabled so test output stays clean", async (t) => {
  const readLogs = captureConsole(t);
  const app = await startTestServer({ logRequests: false });
  t.after(() => app.close());

  await fetch(`${app.baseUrl}/api/v1/health`);
  await new Promise((resolve) => setTimeout(resolve, 50));

  assert.equal(readLogs(), "");
});

test("a rejected request body is never written to the logs", async (t) => {
  // express.json() attaches the offending body to its error object; only the
  // error code is logged, so the body must not surface anywhere.
  const readLogs = captureConsole(t);
  const app = await startTestServer({ logRequests: true });
  t.after(() => app.close());

  await fetch(`${app.baseUrl}/api/v1/health`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: `{"password":"${SECRET_MARKER}", `, // deliberately invalid JSON
  });
  await new Promise((resolve) => setTimeout(resolve, 100));

  const logs = readLogs();

  assert.match(logs, /400 INVALID_JSON/);
  assert.doesNotMatch(logs, new RegExp(SECRET_MARKER), `log leaked a request body:\n${logs}`);
});

test("a client-supplied x-request-id is ignored, not trusted", async (t) => {
  const readLogs = captureConsole(t);
  const app = await startTestServer({ logRequests: true });
  t.after(() => app.close());

  const injected = "INJECTED-LOG-LINE";
  const res = await fetch(`${app.baseUrl}/api/v1/health`, {
    headers: { "x-request-id": injected },
  });
  await new Promise((resolve) => setTimeout(resolve, 100));

  const id = res.headers.get("x-request-id");

  // Always server-generated, so a client cannot forge or pollute log lines.
  assert.match(id, /^[0-9a-f-]{36}$/);
  assert.notEqual(id, injected);
  assert.doesNotMatch(readLogs(), /INJECTED-LOG-LINE/);
});
