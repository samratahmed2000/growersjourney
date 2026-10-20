import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { Project } from "../models/project.js";
import { Milestone } from "../models/milestone.js";
import { ProjectUpdate } from "../models/project-update.js";

const clientId = new mongoose.Types.ObjectId("64b000000000000000000002");
const projectId = new mongoose.Types.ObjectId("64b000000000000000000003");

function validProject(overrides = {}) {
  return new Project({
    name: "Website rebuild",
    clientId,
    startDate: new Date("2026-10-01T00:00:00Z"),
    dueDate: new Date("2026-11-01T00:00:00Z"),
    ...overrides,
  });
}

test("Project defaults to PLANNING and enforces date order", async () => {
  const project = validProject();
  await project.validate();
  assert.equal(project.status, "PLANNING");
  assert.equal(project.collection.collectionName, "projects");

  const backwards = validProject({
    startDate: new Date("2026-12-01T00:00:00Z"),
    dueDate: new Date("2026-11-01T00:00:00Z"),
  });
  await assert.rejects(() => backwards.validate(), /due date cannot be before/i);

  const invalidStatus = validProject({ status: "ARCHIVED" });
  await assert.rejects(() => invalidStatus.validate(), /enum/i);
});

test("Project bounds links and keeps the stored URL shape", async () => {
  const links = Array.from({ length: 11 }, (_, index) => ({
    label: `Link ${index}`,
    url: `https://example.com/${index}`,
  }));

  const tooMany = validProject({ links });
  await assert.rejects(() => tooMany.validate(), /at most 10 links/i);

  const valid = validProject({
    links: [{ label: "Brief", url: "https://example.com/brief" }],
  });
  await valid.validate();
  assert.equal(valid.links[0].url, "https://example.com/brief");
});

test("Milestone derives completedAt from status and defaults to PENDING", async () => {
  const pending = new Milestone({
    projectId,
    title: "Discovery",
  });
  await pending.validate();
  assert.equal(pending.status, "PENDING");
  assert.equal(pending.completedAt, undefined);

  const completed = new Milestone({
    projectId,
    title: "Design",
    status: "COMPLETED",
  });
  await completed.validate();
  assert.ok(completed.completedAt instanceof Date);

  const invalid = new Milestone({
    projectId,
    title: "Bad",
    status: "DONE",
  });
  await assert.rejects(() => invalid.validate(), /enum/i);
});

test("ProjectUpdate defaults to INTERNAL and requires an author", async () => {
  const update = new ProjectUpdate({
    projectId,
    title: "Kickoff",
    body: "The project has started.",
    authorId: "admin-id",
    authorName: "Samrat Ahmed",
  });
  await update.validate();
  assert.equal(update.visibility, "INTERNAL");

  const missingAuthor = new ProjectUpdate({
    projectId,
    title: "Kickoff",
    body: "The project has started.",
  });
  await assert.rejects(() => missingAuthor.validate(), /authorId/i);
});

test("client portal linking fields are explicit and sparse", async () => {
  const { Client } = await import("../models/client.js");
  const client = new Client({
    displayName: "Portal Client",
    primaryEmail: "portal@example.com",
  });
  await client.validate();
  assert.equal(client.userId, undefined);

  const indexes = Client.schema.indexes();
  const userIdIndex = indexes.find(([fields]) => fields.userId === 1);
  assert.ok(userIdIndex);
  assert.equal(userIdIndex[1].unique, true);
  assert.equal(userIdIndex[1].sparse, true);
});
