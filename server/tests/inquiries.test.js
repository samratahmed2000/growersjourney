import test from "node:test";
import assert from "node:assert/strict";
import { startTestServer } from "./helpers/server.js";

/**
 * HTTP tests for POST /api/v1/inquiries.
 *
 * No MongoDB connection is opened. The route accepts an injected repository,
 * which lets these tests cover the success path, the write-failure path, and
 * the rate limiter deterministically.
 */

const VALID = {
  name: "Test Person",
  email: "person@example.com",
  service: "web-application-development",
  projectDescription: "We need a portal for our field staff to record visits.",
};

const MESSAGE = "Thank you — your enquiry has been received.";

/** A repository double that records the data it was asked to save. */
function fakeRepository() {
  const calls = [];
  return {
    calls,
    repository: {
      async create(data) {
        calls.push(data);
        return { id: "fake-id" };
      },
    },
  };
}

async function post(baseUrl, body, { headers = {}, method = "POST" } = {}) {
  const response = await fetch(`${baseUrl}/api/v1/inquiries`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  return { response, json };
}

test("saves a valid inquiry and returns a generic 201", async (t) => {
  const { calls, repository } = fakeRepository();
  const app = await startTestServer({ inquiryRepository: repository });
  t.after(() => app.close());

  const { response, json } = await post(app.baseUrl, {
    ...VALID,
    name: "  Test Person  ",
    email: "  Person@Example.COM ",
    company: "  Example Co  ",
    budget: "  ",
    referenceUrl: "example.com/path",
  });

  assert.equal(response.status, 201);
  assert.deepEqual(json, { success: true, data: { message: MESSAGE } });
  assert.equal(calls.length, 1);

  const saved = calls[0];
  assert.equal(saved.name, "Test Person");
  assert.equal(saved.email, "person@example.com");
  assert.equal(saved.company, "Example Co");
  assert.equal(saved.budget, undefined);
  assert.equal(saved.referenceUrl, "https://example.com/path");
  assert.equal(saved.status, "NEW");

  // The response must not echo the submitted personal information.
  const raw = JSON.stringify(json);
  assert.ok(!raw.includes("person@example.com"));
  assert.ok(!raw.includes("Test Person"));
  assert.ok(!raw.includes("portal for our field staff"));
});

test("rejects a missing required field and does not save", async (t) => {
  const { calls, repository } = fakeRepository();
  const app = await startTestServer({ inquiryRepository: repository });
  t.after(() => app.close());

  const { response, json } = await post(app.baseUrl, { name: "Test Person" });

  assert.equal(response.status, 400);
  assert.equal(json.error.code, "VALIDATION_ERROR");
  assert.equal(calls.length, 0);

  const fields = json.error.details.map((detail) => detail.field);
  for (const field of ["body.email", "body.service", "body.projectDescription"]) {
    assert.ok(fields.includes(field), `expected a detail for ${field}`);
  }
});

test("rejects an invalid email", async (t) => {
  const { calls, repository } = fakeRepository();
  const app = await startTestServer({ inquiryRepository: repository });
  t.after(() => app.close());

  const { response, json } = await post(app.baseUrl, { ...VALID, email: "not-an-email" });

  assert.equal(response.status, 400);
  assert.equal(json.error.code, "VALIDATION_ERROR");
  assert.ok(json.error.details.some((detail) => detail.field === "body.email"));
  assert.equal(calls.length, 0);
});

test("rejects invalid reference URLs", async (t) => {
  const { calls, repository } = fakeRepository();
  const app = await startTestServer({ inquiryRepository: repository });
  t.after(() => app.close());

  for (const referenceUrl of [
    "javascript:alert(1)",
    "ftp://example.com/file",
    "https://user:password@example.com",
  ]) {
    const { response, json } = await post(app.baseUrl, { ...VALID, referenceUrl });
    assert.equal(response.status, 400, referenceUrl);
    assert.ok(
      json.error.details.some((detail) => detail.field === "body.referenceUrl"),
      referenceUrl,
    );
  }

  assert.equal(calls.length, 0);
});

test("rejects an over-long field", async (t) => {
  const { calls, repository } = fakeRepository();
  const app = await startTestServer({ inquiryRepository: repository });
  t.after(() => app.close());

  const { response, json } = await post(app.baseUrl, {
    ...VALID,
    projectDescription: "x".repeat(5001),
  });

  assert.equal(response.status, 400);
  assert.ok(json.error.details.some((detail) => detail.field === "body.projectDescription"));
  assert.equal(calls.length, 0);
});

test("rejects attempts to set internal fields", async (t) => {
  const { calls, repository } = fakeRepository();
  const app = await startTestServer({ inquiryRepository: repository });
  t.after(() => app.close());

  for (const field of ["status", "notes", "assignedTo", "convertedClientId"]) {
    const { response, json } = await post(app.baseUrl, {
      ...VALID,
      [field]: "anything",
    });

    assert.equal(response.status, 400, `${field} must be rejected`);
    assert.equal(json.error.code, "VALIDATION_ERROR");
    const messages = json.error.details.map((detail) => detail.message).join(" ");
    assert.match(messages, new RegExp(field));
  }

  assert.equal(calls.length, 0);
});

test("accepts and discards a honeypot submission", async (t) => {
  const { calls, repository } = fakeRepository();
  const app = await startTestServer({ inquiryRepository: repository });
  t.after(() => app.close());

  const { response, json } = await post(app.baseUrl, {
    ...VALID,
    website: "https://spam.example",
  });

  // Indistinguishable from success, so a bot learns nothing — but nothing is saved.
  assert.equal(response.status, 201);
  assert.deepEqual(json, { success: true, data: { message: MESSAGE } });
  assert.equal(calls.length, 0);
});

test("returns a generic 500 when the database write fails", async (t) => {
  const logged = [];
  const originalError = console.error;
  console.error = (...args) => logged.push(args.join(" "));
  t.after(() => {
    console.error = originalError;
  });

  const app = await startTestServer({
    inquiryRepository: {
      async create() {
        throw new Error(
          "MongoNetworkError: failed to connect to mongodb://app:supersecret@cluster0.example.net",
        );
      },
    },
  });
  t.after(() => app.close());

  const { response, json } = await post(app.baseUrl, VALID);

  assert.equal(response.status, 500);
  assert.deepEqual(json, {
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong." },
  });

  const raw = JSON.stringify(json);
  assert.ok(!raw.includes("supersecret"));
  assert.ok(!raw.includes("MongoNetworkError"));
  assert.ok(!raw.includes("stack"));

  // The server log is the place for diagnostics — with credentials redacted.
  const text = logged.join("\n");
  assert.ok(text.includes("[error]"), "expected the failure to be logged");
  assert.ok(!text.includes("supersecret"), "credentials must not be logged");
});

test("rate-limits repeated submissions", async (t) => {
  const { calls, repository } = fakeRepository();
  const app = await startTestServer({
    inquiryRepository: repository,
    inquiryRateLimit: { windowMs: 60_000, limit: 2 },
  });
  t.after(() => app.close());

  const first = await post(app.baseUrl, VALID);
  const second = await post(app.baseUrl, VALID);
  const third = await post(app.baseUrl, VALID);

  assert.equal(first.response.status, 201);
  assert.equal(second.response.status, 201);
  assert.equal(third.response.status, 429);
  assert.equal(third.json.error.code, "RATE_LIMIT_EXCEEDED");
  assert.ok(third.response.headers.get("retry-after"), "expected a Retry-After header");
  assert.equal(calls.length, 2, "the rejected request must not reach the database");
});

test("rejects an oversized body before any route logic", async (t) => {
  const { calls, repository } = fakeRepository();
  const app = await startTestServer({ inquiryRepository: repository });
  t.after(() => app.close());

  const { response, json } = await post(app.baseUrl, {
    ...VALID,
    projectDescription: "x".repeat(120_000),
  });

  assert.equal(response.status, 413);
  assert.equal(json.error.code, "PAYLOAD_TOO_LARGE");
  assert.equal(calls.length, 0);
});

test("rejects malformed JSON with a controlled error", async (t) => {
  const { calls, repository } = fakeRepository();
  const app = await startTestServer({ inquiryRepository: repository });
  t.after(() => app.close());

  const { response, json } = await post(app.baseUrl, '{"name": ');

  assert.equal(response.status, 400);
  assert.equal(json.error.code, "INVALID_JSON");
  assert.equal(calls.length, 0);
});

test("answers CORS preflight and exposes the retry header", async (t) => {
  const app = await startTestServer();
  t.after(() => app.close());

  const response = await fetch(`${app.baseUrl}/api/v1/inquiries`, {
    method: "OPTIONS",
    headers: {
      origin: "http://localhost:3000",
      "access-control-request-method": "POST",
    },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:3000");
  assert.match(
    response.headers.get("access-control-expose-headers") ?? "",
    /retry-after/i,
  );
});

test("does not accept unsupported methods", async (t) => {
  const { repository } = fakeRepository();
  const app = await startTestServer({ inquiryRepository: repository });
  t.after(() => app.close());

  const response = await fetch(`${app.baseUrl}/api/v1/inquiries`);
  const json = await response.json();

  assert.equal(response.status, 404);
  assert.equal(json.error.code, "NOT_FOUND");
  assert.equal(response.headers.get("x-powered-by"), null);
});
