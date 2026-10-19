import test from "node:test";
import assert from "node:assert/strict";
import { redactText } from "../utils/redact.js";

/**
 * Unit tests for the log redaction helper (utils/redact.js).
 *
 * The rule these enforce: error text is written to logs, but credentials, keys,
 * and tokens inside that text are not.
 */

test("masks credentials in a MongoDB connection string but keeps the host", () => {
  const output = redactText(
    "failed to connect to mongodb+srv://appuser:S3cretP4ss@cluster0.example.mongodb.net/growers_journy",
  );

  assert.doesNotMatch(output, /S3cretP4ss/, "password was not masked");
  assert.doesNotMatch(output, /appuser/, "username was not masked");
  // The host stays visible: it is what makes the log line useful.
  assert.match(output, /mongodb\+srv:\/\/\[redacted\]@cluster0\.example\.mongodb\.net/);
});

test("masks credentials in any URL scheme", () => {
  const output = redactText("GET https://admin:hunter2@internal.example.com/api failed");

  assert.doesNotMatch(output, /hunter2/);
  assert.match(output, /https:\/\/\[redacted\]@internal\.example\.com/);
});

test("masks bearer and basic authorization values", () => {
  const output = redactText(
    "upstream rejected Authorization: Bearer sk-live-9f3a1c2b7d and Basic YWRtaW46c2VjcmV0",
  );

  assert.doesNotMatch(output, /sk-live-9f3a1c2b7d/);
  assert.doesNotMatch(output, /YWRtaW46c2VjcmV0/);
  assert.match(output, /Bearer \[redacted\]/i);
  assert.match(output, /Basic \[redacted\]/i);
});

test("masks key=value and key: value forms", () => {
  const output = redactText(
    "payload rejected password=hunter2 apiKey: sk-live-abc123 cookie=session%3Dabc123",
  );

  assert.doesNotMatch(output, /hunter2/);
  assert.doesNotMatch(output, /sk-live-abc123/);
  assert.doesNotMatch(output, /session%3Dabc123/);
  assert.match(output, /password=\[redacted\]/i);
});

test("masks JSON Web Tokens", () => {
  const jwt =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVPmB92K27uhbUJU1p1r_wW1gFWFOEjXk";
  const output = redactText(`session token invalid: ${jwt}`);

  assert.doesNotMatch(output, /eyJhbGciOiJIUzI1NiJ9/);
  assert.match(output, /\[redacted-jwt\]/);
});

test("leaves ordinary text untouched", () => {
  // Guards against over-redaction: normal diagnostics must stay readable.
  const lines = [
    "MongoDB connection closed.",
    "[req] 3f2f2b1c GET /api/v1/health 200 1.4ms",
    "Please check the submitted information.",
  ];

  for (const line of lines) {
    assert.equal(redactText(line), line);
  }
});

test("returns non-string values unchanged instead of throwing", () => {
  assert.equal(redactText(undefined), undefined);
  assert.equal(redactText(null), null);
  assert.equal(redactText(42), 42);
});

test("truncates very long text so a log line cannot be flooded", () => {
  const output = redactText("x".repeat(5000));

  assert.ok(output.length < 5000);
  assert.match(output, /\[truncated\]$/);
});

test("redacts before truncating so a cut credential cannot survive", () => {
  // If truncation ran first, the password below could be sliced into a fragment
  // that no rule matches any more.
  const output = redactText(`mongodb://user:S3cretP4ss@host:27017/db ${"y".repeat(5000)}`);

  assert.doesNotMatch(output, /S3cretP4ss/);
});
