import test from "node:test";
import assert from "node:assert/strict";
import { Client } from "../models/client.js";
import { Project } from "../models/project.js";
import { Service } from "../models/service.js";
import { PortfolioProject } from "../models/portfolio-project.js";
import {
  INQUIRY_STATUS_TRANSITIONS,
  PENDING_INQUIRY_STATUSES,
} from "../constants/inquiry.js";
import {
  createPortfolioSchema,
  updatePortfolioSchema,
} from "../validators/admin/portfolio.js";
import { createServiceSchema } from "../validators/admin/service.js";
import {
  createClientSchema,
  updateClientSchema,
} from "../validators/admin/client.js";
import { serializeInquiryDetail } from "../utils/serializers.js";

const CLIENT_ID = "64b000000000000000000001";

test("Client normalizes email and defaults to ACTIVE", async () => {
  const client = new Client({
    displayName: "Example Client",
    primaryEmail: "HELLO@Example.COM",
  });

  await client.validate();
  assert.equal(client.primaryEmail, "hello@example.com");
  assert.equal(client.status, "ACTIVE");
});

test("Client rejects an invalid status and short name", async () => {
  const client = new Client({
    displayName: "A",
    primaryEmail: "hello@example.com",
    status: "DELETED",
  });

  await assert.rejects(() => client.validate(), /displayName|status/);
});

test("Project requires a client and validates date order", async () => {
  const missingClient = new Project({ name: "Test project" });
  await assert.rejects(() => missingClient.validate(), /clientId/);

  const inverted = new Project({
    name: "Test project",
    clientId: CLIENT_ID,
    startDate: new Date("2026-10-10"),
    dueDate: new Date("2026-10-01"),
  });
  await assert.rejects(() => inverted.validate(), /dueDate/);
});

test("Service enforces slug, defaults, and bounded lists", async () => {
  const service = new Service({
    title: "Automation Audit",
    slug: "Automation Audit",
    summary: "A valid summary for the service record.",
  });
  await assert.rejects(() => service.validate(), /slug/);

  const valid = new Service({
    title: "Automation Audit",
    slug: "automation-audit",
    summary: "A valid summary for the service record.",
    problems: Array.from({ length: 21 }, (_, index) => `Problem ${index}`),
  });
  await assert.rejects(() => valid.validate(), /20 items or fewer/);

  const defaults = new Service({
    title: "Automation Audit",
    slug: "automation-audit",
    summary: "A valid summary for the service record.",
  });
  await defaults.validate();
  assert.equal(defaults.isPublished, false);
  assert.equal(defaults.isArchived, false);
  assert.deepEqual(defaults.problems, []);
});

test("Portfolio defaults to a sample and validates URL arrays", async () => {
  const entry = new PortfolioProject({
    title: "Operations Dashboard Concept",
    slug: "operations-dashboard-concept",
    summary: "A clearly labelled concept for an operations dashboard.",
    imageUrls: Array.from({ length: 9 }, (_, index) => `https://example.com/${index}.png`),
  });
  await assert.rejects(() => entry.validate(), /8 images or fewer/);

  const defaults = new PortfolioProject({
    title: "Operations Dashboard Concept",
    slug: "operations-dashboard-concept",
    summary: "A clearly labelled concept for an operations dashboard.",
  });
  await defaults.validate();
  assert.equal(defaults.isSample, true);
  assert.equal(defaults.isPublished, false);
});

test("portfolio validation rejects unsafe URLs and cleans optional strings", () => {
  assert.equal(
    createPortfolioSchema.safeParse({
      title: "Concept",
      slug: "concept",
      summary: "A sufficiently long portfolio summary.",
      liveUrl: "javascript:alert(1)",
    }).success,
    false,
  );

  const parsed = createPortfolioSchema.parse({
    title: "Concept",
    slug: "concept",
    summary: "A sufficiently long portfolio summary.",
    liveUrl: "example.com/demo",
    thumbnailUrl: "",
  });
  assert.equal(parsed.liveUrl, "https://example.com/demo");
  assert.equal(parsed.thumbnailUrl, undefined);
});

test("service and client update schemas reject empty objects", () => {
  assert.equal(updatePortfolioSchema.safeParse({}).success, false);
  assert.equal(updateClientSchema.safeParse({}).success, false);
  assert.equal(
    createServiceSchema.safeParse({
      slug: "invalid slug",
      title: "Title",
      summary: "A sufficiently long summary.",
    }).success,
    false,
  );
});

test("client validation normalizes email and rejects unknown fields", () => {
  const parsed = createClientSchema.parse({
    displayName: "Example Client",
    primaryEmail: "  HELLO@Example.COM ",
  });
  assert.equal(parsed.primaryEmail, "hello@example.com");
  assert.equal(parsed.status, "ACTIVE");

  assert.equal(
    createClientSchema.safeParse({
      displayName: "Example Client",
      primaryEmail: "hello@example.com",
      role: "ADMIN",
    }).success,
    false,
  );

  assert.equal(
    updateClientSchema.safeParse({ status: "ACTIVE" }).success,
    true,
  );
});

test("inquiry transition map and serializers expose only safe fields", () => {
  assert.deepEqual(PENDING_INQUIRY_STATUSES, ["REVIEWING", "QUALIFIED"]);
  assert.deepEqual(INQUIRY_STATUS_TRANSITIONS.CLOSED, []);
  assert.equal(INQUIRY_STATUS_TRANSITIONS.NEW.includes("QUALIFIED"), false);

  const serialized = serializeInquiryDetail({
    _id: "64b000000000000000000001",
    name: "Test Person",
    email: "person@example.com",
    company: "Example Co",
    service: "business-automation",
    projectDescription: "A sufficiently long description of the project.",
    status: "NEW",
    statusChangedBy: "admin-user-id",
    createdAt: new Date("2026-10-01T10:00:00Z"),
    updatedAt: new Date("2026-10-01T10:00:00Z"),
  });

  assert.deepEqual(serialized.allowedNextStatuses, ["REVIEWING", "CLOSED"]);
  assert.equal(serialized.statusChangedBy, undefined);
  assert.equal(serialized.__v, undefined);
  assert.equal(serialized._id, undefined);
});
