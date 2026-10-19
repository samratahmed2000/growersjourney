import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { startTestServer } from "./helpers/server.js";
import { requestId } from "../middleware/request-id.js";
import { errorHandler } from "../middleware/error-handler.js";
import { notFound } from "../middleware/not-found.js";
import { badRequest } from "../utils/http-error.js";

/** A tiny app used to exercise the error handler in isolation. */
function startThrowingApp(handler) {
  const app = express();
  app.use(requestId);
  app.use(express.json());
  app.get("/boom", handler);
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

test("malformed JSON returns 400 INVALID_JSON", async (t) => {
  const app = await startTestServer();
  t.after(() => app.close());

  const res = await fetch(`${app.baseUrl}/api/v1/health`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: '{"name": ',
  });

  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), {
    success: false,
    error: {
      code: "INVALID_JSON",
      message: "The request body is not valid JSON.",
    },
  });
});

test("a body over the configured limit returns 413 PAYLOAD_TOO_LARGE", async (t) => {
  // A deliberately small limit keeps the test fast and deterministic.
  const app = await startTestServer({ jsonLimit: "1kb" });
  t.after(() => app.close());

  const res = await fetch(`${app.baseUrl}/api/v1/health`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ padding: "x".repeat(5000) }),
  });

  assert.equal(res.status, 413);
  assert.equal((await res.json()).error.code, "PAYLOAD_TOO_LARGE");
});

test("an unexpected error returns a generic 500 and leaks nothing", async (t) => {
  const leak = "SECRET_INTERNAL_DETAIL_mongodb://user:pass@host/db";
  const app = startThrowingApp(() => {
    throw new Error(leak);
  });
  t.after(() => app.close());

  const res = await fetch(`${await app.baseUrl()}/boom`);
  const text = await res.text();

  assert.equal(res.status, 500);
  assert.deepEqual(JSON.parse(text), {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong.",
    },
  });
  // The original message and any stack frames must not reach the client.
  assert.doesNotMatch(text, /SECRET_INTERNAL_DETAIL/);
  assert.doesNotMatch(text, /at .*\(.*:\d+:\d+\)/);
  assert.doesNotMatch(text, /mongodb:\/\//);
});

test("a deliberately raised HttpError keeps its status, code, and safe details", async (t) => {
  const app = startThrowingApp(() => {
    throw badRequest("Please check the submitted information.", [
      { field: "body.email", message: "Invalid email" },
    ]);
  });
  t.after(() => app.close());

  const res = await fetch(`${await app.baseUrl()}/boom`);

  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Please check the submitted information.",
      details: [{ field: "body.email", message: "Invalid email" }],
    },
  });
});

test("an unexpected error is logged server-side with credentials redacted", async (t) => {
  // A dependency (driver, SDK, HTTP client) can embed a connection string or a
  // key in its message. The response is already safe; this asserts the *log*
  // is too, which is the part a log file would otherwise leak.
  const lines = [];
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = (...args) => lines.push(args.join(" "));
  console.warn = (...args) => lines.push(args.join(" "));
  t.after(() => {
    console.error = originalError;
    console.warn = originalWarn;
  });

  const connectionString =
    "mongodb+srv://appuser:S3cretP4ss@cluster0.example.mongodb.net/growers_journy";
  const apiKey = "sk-live-9f3a1c2b7d";

  const app = startThrowingApp(() => {
    throw new Error(`query failed using ${connectionString} with apiKey=${apiKey}`);
  });
  t.after(() => app.close());

  const res = await fetch(`${await app.baseUrl()}/boom`);
  assert.equal(res.status, 500);

  const logs = lines.join("\n");

  assert.match(logs, /\[error\]/, "the failure must still be logged for debugging");
  assert.match(logs, /\[redacted\]/, "expected redaction to have run");
  assert.doesNotMatch(logs, /S3cretP4ss/, `password leaked into the log:\n${logs}`);
  assert.doesNotMatch(logs, /appuser/, `username leaked into the log:\n${logs}`);
  assert.doesNotMatch(logs, new RegExp(apiKey), `api key leaked into the log:\n${logs}`);
});

test("an async route that rejects is forwarded to the error handler", async (t) => {
  // Express 5 forwards rejected promises automatically; this guards that
  // assumption so a future upgrade cannot silently break error handling.
  const app = startThrowingApp(async () => {
    await Promise.reject(new Error("async failure"));
  });
  t.after(() => app.close());

  const res = await fetch(`${await app.baseUrl()}/boom`);

  assert.equal(res.status, 500);
  assert.equal((await res.json()).error.code, "INTERNAL_ERROR");
});
