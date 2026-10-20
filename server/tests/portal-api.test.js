import test from "node:test";
import assert from "node:assert/strict";
import { createSignedInUser, IDS } from "./helpers/admin.js";
import {
  addSecondClient,
  jsonRequest,
  linkClientUser,
  SECOND_MILESTONE_ID,
  SECOND_PROJECT_ID,
  startPortalTestServer,
} from "./helpers/portal.js";

test("portal requires a linked active client, not just the CLIENT role", async (t) => {
  const server = await startPortalTestServer();
  t.after(() => server.close());

  const unlinked = await createSignedInUser(server, "CLIENT");
  const denied = await jsonRequest(
    server.baseUrl,
    "/api/v1/portal/dashboard",
    { cookie: unlinked.cookie },
  );

  assert.equal(denied.response.status, 403);
  assert.equal(denied.json.error.code, "PORTAL_ACCESS_DENIED");

  const admin = await createSignedInUser(server, "ADMIN");
  const adminDenied = await jsonRequest(
    server.baseUrl,
    "/api/v1/portal/dashboard",
    { cookie: admin.cookie },
  );
  assert.equal(adminDenied.response.status, 403);
  assert.equal(adminDenied.json.error.code, "FORBIDDEN");

  const linked = await linkClientUser({
    app: server,
    auth: server.auth,
    data: server.data,
  });
  const allowed = await jsonRequest(server.baseUrl, "/api/v1/portal/dashboard", {
    cookie: linked.cookie,
  });

  assert.equal(allowed.response.status, 200);
  assert.equal(allowed.json.success, true);
  assert.equal(allowed.json.data.client.displayName, "Test Client");

  server.data.clients[0].status = "INACTIVE";
  const inactive = await jsonRequest(
    server.baseUrl,
    "/api/v1/portal/dashboard",
    { cookie: linked.cookie },
  );
  assert.equal(inactive.response.status, 403);
  assert.equal(inactive.json.error.code, "PORTAL_ACCESS_DENIED");
});

test("dashboard is scoped to the linked client and hides internal updates", async (t) => {
  const server = await startPortalTestServer();
  t.after(() => server.close());
  addSecondClient(server.data);

  const linked = await linkClientUser({
    app: server,
    auth: server.auth,
    data: server.data,
  });

  const { response, json } = await jsonRequest(
    server.baseUrl,
    "/api/v1/portal/dashboard",
    { cookie: linked.cookie },
  );

  assert.equal(response.status, 200);
  const data = json.data;

  assert.equal(data.stats.activeProjects, 1);
  assert.equal(data.stats.upcomingMilestones, 1);
  assert.equal(data.stats.completedMilestones, 1);

  assert.deepEqual(
    data.activeProjects.map((project) => project.id),
    [IDS.project],
  );
  assert.ok(
    data.recentlyUpdatedProjects.every((project) => project.id !== SECOND_PROJECT_ID),
  );

  assert.equal(data.upcomingMilestones.length, 1);
  assert.equal(data.upcomingMilestones[0].projectName, "Test Project");
  assert.equal(data.upcomingMilestones[0].id, IDS.milestone);

  assert.deepEqual(
    data.recentActivity.map((update) => update.id),
    [IDS.update],
  );
  assert.equal(
    data.recentActivity.some((update) => update.id === IDS.internalUpdate),
    false,
  );
  assert.equal(
    data.recentActivity.some((update) =>
      update.body.includes("must not reach the portal"),
    ),
    false,
  );

  // Client-safe summaries do not leak the admin-only client record.
  assert.equal("client" in data.activeProjects[0], false);
});

test("portal project list, detail, milestones, and updates enforce ownership", async (t) => {
  const server = await startPortalTestServer();
  t.after(() => server.close());
  addSecondClient(server.data);

  const linked = await linkClientUser({
    app: server,
    auth: server.auth,
    data: server.data,
  });
  const cookie = linked.cookie;

  const list = await jsonRequest(server.baseUrl, "/api/v1/portal/projects", {
    cookie,
  });
  assert.equal(list.response.status, 200);
  assert.deepEqual(
    list.json.data.items.map((project) => project.id),
    [IDS.project],
  );
  assert.deepEqual(list.json.data.items[0].milestoneCounts, {
    total: 2,
    completed: 1,
  });

  const forgedFilter = await jsonRequest(
    server.baseUrl,
    `/api/v1/portal/projects?clientId=${SECOND_PROJECT_ID.replace(/\d$/, "1")}`,
    { cookie },
  );
  assert.equal(forgedFilter.response.status, 400);
  assert.equal(forgedFilter.json.error.code, "VALIDATION_ERROR");

  const own = await jsonRequest(
    server.baseUrl,
    `/api/v1/portal/projects/${IDS.project}`,
    { cookie },
  );
  assert.equal(own.response.status, 200);
  assert.equal(own.json.data.project.id, IDS.project);
  assert.deepEqual(own.json.data.project.milestoneCounts, {
    total: 2,
    completed: 1,
  });
  assert.equal("client" in own.json.data.project, false);

  const crossClient = await jsonRequest(
    server.baseUrl,
    `/api/v1/portal/projects/${SECOND_PROJECT_ID}`,
    { cookie },
  );
  assert.equal(crossClient.response.status, 404);
  assert.equal(crossClient.json.error.code, "NOT_FOUND");

  const crossMilestone = await jsonRequest(
    server.baseUrl,
    `/api/v1/portal/projects/${SECOND_PROJECT_ID}/milestones`,
    { cookie },
  );
  assert.equal(crossMilestone.response.status, 404);

  const crossUpdates = await jsonRequest(
    server.baseUrl,
    `/api/v1/portal/projects/${SECOND_PROJECT_ID}/updates`,
    { cookie },
  );
  assert.equal(crossUpdates.response.status, 404);

  const ownMilestones = await jsonRequest(
    server.baseUrl,
    `/api/v1/portal/projects/${IDS.project}/milestones`,
    { cookie },
  );
  assert.equal(ownMilestones.response.status, 200);
  assert.equal(ownMilestones.json.data.items.length, 2);
  assert.equal(
    ownMilestones.json.data.items.some((item) =>
      Object.hasOwn(item, "allowedNextStatuses"),
    ),
    false,
  );
  assert.ok(
    ownMilestones.json.data.items.every(
      (item) => item.id !== SECOND_MILESTONE_ID,
    ),
  );

  const ownUpdates = await jsonRequest(
    server.baseUrl,
    `/api/v1/portal/projects/${IDS.project}/updates`,
    { cookie },
  );
  assert.equal(ownUpdates.response.status, 200);
  assert.deepEqual(
    ownUpdates.json.data.items.map((update) => update.id),
    [IDS.update],
  );
  assert.equal("visibility" in ownUpdates.json.data.items[0], false);

  const malformed = await jsonRequest(
    server.baseUrl,
    "/api/v1/portal/projects/not-an-object-id",
    { cookie },
  );
  assert.equal(malformed.response.status, 400);
});

test("a repository failure on the portal returns a generic 500", async (t) => {
  const server = await startPortalTestServer();
  t.after(() => server.close());

  const linked = await linkClientUser({
    app: server,
    auth: server.auth,
    data: server.data,
  });

  server.repositories.dashboard.getDashboard = async () => {
    throw new Error("SECRET_INTERNAL_DETAIL_mongodb://user:pass@host/db");
  };

  const { response, json } = await jsonRequest(
    server.baseUrl,
    "/api/v1/portal/dashboard",
    { cookie: linked.cookie },
  );

  assert.equal(response.status, 500);
  assert.equal(json.error.code, "INTERNAL_ERROR");
  assert.equal(json.error.message, "Something went wrong.");
  assert.equal(JSON.stringify(json).includes("SECRET_INTERNAL_DETAIL"), false);
});
