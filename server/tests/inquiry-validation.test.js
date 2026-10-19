import test from "node:test";
import assert from "node:assert/strict";
import { createInquirySchema, normalizeReferenceUrl } from "../validators/inquiry.js";

/**
 * Unit tests for the public inquiry schema.
 *
 * These never touch HTTP or MongoDB. They pin down the normalization rules
 * (email case, URL form, empty optionals) and the strict-object behaviour that
 * makes privileged fields fail instead of being silently dropped.
 */

const VALID = {
  name: "Test Person",
  email: "person@example.com",
  service: "web-application-development",
  projectDescription: "We need a portal for our field staff to record visits.",
};

function parse(overrides = {}) {
  return createInquirySchema.safeParse({ ...VALID, ...overrides });
}

function issuePaths(result) {
  assert.equal(result.success, false, "expected the schema to reject this input");
  return result.error.issues.map((issue) => issue.path.join("."));
}

test("accepts a valid inquiry and keeps the required fields", () => {
  const result = parse();

  assert.equal(result.success, true);
  assert.equal(result.data.name, "Test Person");
  assert.equal(result.data.email, "person@example.com");
  assert.equal(result.data.service, "web-application-development");
  assert.equal(result.data.projectDescription, VALID.projectDescription);
});

test("trims text and lower-cases the email", () => {
  const result = parse({
    name: "  Test Person  ",
    email: "  Person@Example.COM ",
    company: "  Example Co  ",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.name, "Test Person");
  assert.equal(result.data.email, "person@example.com");
  assert.equal(result.data.company, "Example Co");
});

test("treats blank optional fields as not provided", () => {
  const result = parse({ company: "   ", budget: "", timeline: "", referenceUrl: " " });

  assert.equal(result.success, true);
  assert.equal(result.data.company, undefined);
  assert.equal(result.data.budget, undefined);
  assert.equal(result.data.timeline, undefined);
  assert.equal(result.data.referenceUrl, undefined);
});

test("rejects missing required fields", () => {
  const result = createInquirySchema.safeParse({});

  assert.equal(result.success, false);
  const fields = result.error.issues.map((issue) => issue.path.join("."));
  for (const field of ["name", "email", "service", "projectDescription"]) {
    assert.ok(fields.includes(field), `expected an error for ${field}`);
  }
});

test("rejects an invalid email", () => {
  assert.deepEqual(issuePaths(parse({ email: "not-an-email" })), ["email"]);
});

test("rejects a too-short name and too-short description", () => {
  assert.deepEqual(issuePaths(parse({ name: "A" })), ["name"]);
  assert.deepEqual(issuePaths(parse({ projectDescription: "Too short." })), [
    "projectDescription",
  ]);
});

test("rejects values over the length limits", () => {
  assert.deepEqual(issuePaths(parse({ name: "x".repeat(101) })), ["name"]);
  assert.deepEqual(issuePaths(parse({ company: "x".repeat(121) })), ["company"]);
  assert.deepEqual(issuePaths(parse({ budget: "x".repeat(101) })), ["budget"]);
  assert.deepEqual(issuePaths(parse({ timeline: "x".repeat(101) })), ["timeline"]);
  assert.deepEqual(issuePaths(parse({ projectDescription: "x".repeat(5001) })), [
    "projectDescription",
  ]);
});

test("rejects a service outside the allowlist", () => {
  assert.deepEqual(issuePaths(parse({ service: "something-else" })), ["service"]);
  assert.equal(parse({ service: "not-sure" }).success, true);
});

test("rejects privileged and unknown fields instead of stripping them", () => {
  for (const field of ["status", "notes", "assignedTo", "convertedClientId", "_id", "createdAt"]) {
    const result = parse({ [field]: "anything" });
    assert.equal(result.success, false, `${field} must be rejected`);

    const messages = result.error.issues.map((issue) => issue.message).join(" ");
    assert.match(messages, new RegExp(field), `the error should name ${field}`);
  }
});

test("accepts the declared honeypot field", () => {
  const result = parse({ website: "https://spam.example" });

  assert.equal(result.success, true);
  assert.equal(result.data.website, "https://spam.example");
});

test("normalizes a bare domain to https", () => {
  const result = parse({ referenceUrl: "example.com/path?q=1" });

  assert.equal(result.success, true);
  assert.equal(result.data.referenceUrl, "https://example.com/path?q=1");
});

test("keeps an explicit http or https URL", () => {
  assert.equal(parse({ referenceUrl: "http://example.com" }).data.referenceUrl, "http://example.com/");
  assert.equal(
    parse({ referenceUrl: "https://example.com/work" }).data.referenceUrl,
    "https://example.com/work",
  );
});

test("rejects non-http protocols and embedded credentials", () => {
  for (const value of [
    "javascript:alert(1)",
    "ftp://example.com/file",
    "mailto:person@example.com",
    "https://user:password@example.com",
    "not a url at all",
  ]) {
    assert.deepEqual(issuePaths(parse({ referenceUrl: value })), ["referenceUrl"], value);
  }
});

test("normalizeReferenceUrl returns undefined for empty input", () => {
  assert.equal(normalizeReferenceUrl(""), undefined);
  assert.equal(normalizeReferenceUrl("   "), undefined);
  assert.equal(normalizeReferenceUrl(undefined), undefined);
});

test("normalizeReferenceUrl rejects values that are too long after normalization", () => {
  const long = `https://example.com/${"a".repeat(2100)}`;
  assert.equal(normalizeReferenceUrl(long), null);
});
