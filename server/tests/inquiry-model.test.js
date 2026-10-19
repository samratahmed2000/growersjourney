import test from "node:test";
import assert from "node:assert/strict";
import { Inquiry } from "../models/inquiry.js";

/**
 * Model tests that never open a connection.
 *
 * Mongoose validates a document in memory, so `doc.validate()` covers required
 * fields, enums, length limits, defaults, and the optional-field setter without
 * MongoDB. This is the last line of defence behind the Zod validator.
 */

const VALID = {
  name: "Test Person",
  email: "person@example.com",
  service: "web-application-development",
  projectDescription: "We need a portal for our field staff to record visits.",
};

function document(overrides = {}) {
  return new Inquiry({ ...VALID, ...overrides });
}

test("uses the inquiries collection and enables timestamps", () => {
  assert.equal(Inquiry.collection.collectionName, "inquiries");
  assert.equal(Inquiry.schema.options.timestamps, true);
  assert.equal(Inquiry.schema.options.versionKey, false);
});

test("defaults the status to NEW", async () => {
  const doc = document();
  await doc.validate();

  assert.equal(doc.status, "NEW");
});

test("lower-cases the email on the stored document", async () => {
  const doc = document({ email: "Person@Example.COM" });
  await doc.validate();

  assert.equal(doc.email, "person@example.com");
});

test("stores blank optional fields as absent", async () => {
  const doc = document({ company: "   ", budget: "", timeline: " " });
  await doc.validate();

  assert.equal(doc.company, undefined);
  assert.equal(doc.budget, undefined);
  assert.equal(doc.timeline, undefined);
});

test("rejects a document missing required fields", async () => {
  await assert.rejects(
    () => new Inquiry({}).validate(),
    (error) => {
      assert.equal(error.name, "ValidationError");
      for (const field of ["name", "email", "service", "projectDescription"]) {
        assert.ok(error.errors[field], `expected a validation error for ${field}`);
      }
      return true;
    },
  );
});

test("rejects an unknown status", async () => {
  await assert.rejects(
    () => document({ status: "APPROVED" }).validate(),
    (error) => Boolean(error.errors.status),
  );
});

test("rejects an unknown service", async () => {
  await assert.rejects(
    () => document({ service: "something-else" }).validate(),
    (error) => Boolean(error.errors.service),
  );
});

test("rejects a too-short description and an over-long name", async () => {
  await assert.rejects(
    () => document({ projectDescription: "Too short." }).validate(),
    (error) => Boolean(error.errors.projectDescription),
  );

  await assert.rejects(
    () => document({ name: "x".repeat(101) }).validate(),
    (error) => Boolean(error.errors.name),
  );
});
