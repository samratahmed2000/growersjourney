import test from "node:test";
import assert from "node:assert/strict";
import {
  createFakeAdminRepositories,
  createSignedInUser,
  IDS,
  jsonRequest,
  startAdminTestServer,
} from "./helpers/admin.js";
import {
  addSecondClient,
  linkClientUser,
  SECOND_CLIENT_ID,
  startPortalTestServer,
} from "./helpers/portal.js";

async function adminServer() {
  const { repositories, data } = createFakeAdminRepositories();
  const server = await startAdminTestServer(repositories);
  const admin = await createSignedInUser(server, "ADMIN");
  return { server, data, cookie: admin.cookie };
}

test("admin can create a project only for a valid active client", async (t) => {
  const { server, data, cookie } = await adminServer();
  t.after(() => server.close());

  const valid = await jsonRequest(server.baseUrl, "/api/v1/admin/projects", {
    method: "POST",
    cookie,
    body: {
      name: "New Client Website",
      description: "A new marketing site.",
      clientId: IDS.client,
      startDate: "2026-10-10",
      dueDate: "2026-12-10",
      links: [{ label: "Project brief", url: "example.com/brief" }],
    },
  });

  assert.equal(valid.response.status, 201);
  assert.equal(valid.json.data.project.name, "New Client Website");
  assert.equal(valid.json.data.project.status, "PLANNING");
  assert.equal(valid.json.data.project.client.id, IDS.client);
  assert.equal(valid.json.data.project.client.displayName, "Test Client");
  assert.equal(
    valid.json.data.project.links[0].url,
    "https://example.com/brief",
  );
  assert.deepEqual(valid.json.data.project.milestoneCounts, {
    total: 0,
    completed: 0,
  });

  const invalidDates = await jsonRequest(
    server.baseUrl,
    "/api/v1/admin/projects",
    {
      method: "POST",
      cookie,
      body: {
        name: "Backwards Dates",
        clientId: IDS.client,
        startDate: "2026-12-10",
        dueDate: "2026-10-10",
      },
    },
  );
  assert.equal(invalidDates.response.status, 400);
  assert.equal(invalidDates.json.error.code, "VALIDATION_ERROR");

  const unknownClient = await jsonRequest(
    server.baseUrl,
    "/api/v1/admin/projects",
    {
      method: "POST",
      cookie,
      body: {
        name: "Unknown Client Project",
        clientId: "64b000000000000000000098",
      },
    },
  );
  assert.equal(unknownClient.response.status, 404);

  const unknownField = await jsonRequest(
    server.baseUrl,
    "/api/v1/admin/projects",
    {
      method: "POST",
      cookie,
      body: {
        name: "Privilege Attempt",
        clientId: IDS.client,
        status: "COMPLETED",
      },
    },
  );
  assert.equal(unknownField.response.status, 400);

  data.clients[0].status = "INACTIVE";
  const inactiveClient = await jsonRequest(
    server.baseUrl,
    "/api/v1/admin/projects",
    {
      method: "POST",
      cookie,
      body: {
        name: "Inactive Client Project",
        clientId: IDS.client,
      },
    },
  );
  assert.equal(inactiveClient.response.status, 409);
  assert.equal(inactiveClient.json.error.code, "CLIENT_INACTIVE");
});

test("admin project updates validate dates and allowed status transitions", async (t) => {
  const { server, data, cookie } = await adminServer();
  t.after(() => server.close());

  const updated = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}`,
    {
      method: "PATCH",
      cookie,
      body: {
        name: "Renamed Project",
        dueDate: "2026-11-20",
        links: [{ label: "Figma", url: "https://figma.com/file/example" }],
      },
    },
  );
  assert.equal(updated.response.status, 200);
  assert.equal(updated.json.data.project.name, "Renamed Project");
  assert.equal(updated.json.data.project.dueDate, "2026-11-20T00:00:00.000Z");
  assert.equal(updated.json.data.project.links[0].url, "https://figma.com/file/example");

  const invalidDate = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}`,
    {
      method: "PATCH",
      cookie,
      body: { startDate: "2026-12-01" },
    },
  );
  assert.equal(invalidDate.response.status, 400);

  const invalidTransition = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}/status`,
    {
      method: "PATCH",
      cookie,
      body: { status: "PLANNING" },
    },
  );
  assert.equal(invalidTransition.response.status, 409);
  assert.equal(invalidTransition.json.error.code, "INVALID_STATUS_TRANSITION");

  const completed = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}/status`,
    {
      method: "PATCH",
      cookie,
      body: { status: "COMPLETED" },
    },
  );
  assert.equal(completed.response.status, 200);
  assert.equal(completed.json.data.project.status, "COMPLETED");
  assert.ok(completed.json.data.project.completedAt);
  assert.deepEqual(completed.json.data.project.allowedNextStatuses, [
    "IN_PROGRESS",
  ]);

  const reopened = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}/status`,
    {
      method: "PATCH",
      cookie,
      body: { status: "IN_PROGRESS" },
    },
  );
  assert.equal(reopened.response.status, 200);
  assert.equal(reopened.json.data.project.completedAt, null);

  addSecondClient(data);
  const reassigned = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}`,
    {
      method: "PATCH",
      cookie,
      body: { clientId: SECOND_CLIENT_ID },
    },
  );
  assert.equal(reassigned.response.status, 200);
  assert.equal(reassigned.json.data.project.client.id, SECOND_CLIENT_ID);

  data.clients[0].status = "INACTIVE";
  const inactiveAssignment = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}`,
    {
      method: "PATCH",
      cookie,
      body: { clientId: IDS.client },
    },
  );
  assert.equal(inactiveAssignment.response.status, 409);
  assert.equal(inactiveAssignment.json.error.code, "CLIENT_INACTIVE");

  const missing = await jsonRequest(
    server.baseUrl,
    "/api/v1/admin/projects/64b000000000000000000098",
    {
      method: "PATCH",
      cookie,
      body: { name: "Missing Project" },
    },
  );
  assert.equal(missing.response.status, 404);

  const unknownField = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}`,
    {
      method: "PATCH",
      cookie,
      body: { status: "COMPLETED" },
    },
  );
  assert.equal(unknownField.response.status, 400);
});

test("admin milestone create/update validates project dates and transitions", async (t) => {
  const { server, cookie } = await adminServer();
  t.after(() => server.close());

  const list = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}/milestones`,
    { cookie },
  );
  assert.equal(list.response.status, 200);
  assert.equal(list.json.data.items.length, 2);
  assert.deepEqual(list.json.data.items[0].allowedNextStatuses, [
    "PENDING",
    "COMPLETED",
    "BLOCKED",
  ]);

  const created = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}/milestones`,
    {
      method: "POST",
      cookie,
      body: {
        title: "Design handoff",
        description: "Share the final design files.",
        dueDate: "2026-10-30",
      },
    },
  );
  assert.equal(created.response.status, 201);
  assert.equal(created.json.data.milestone.status, "PENDING");
  assert.equal(created.json.data.milestone.sortOrder, 2);

  for (const dueDate of ["2026-09-01", "2026-12-01"]) {
    const outsideProject = await jsonRequest(
      server.baseUrl,
      `/api/v1/admin/projects/${IDS.project}/milestones`,
      {
        method: "POST",
        cookie,
        body: { title: "Outside project dates", dueDate },
      },
    );
    assert.equal(outsideProject.response.status, 400);
    assert.equal(outsideProject.json.error.code, "VALIDATION_ERROR");
  }

  const invalidStatus = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}/milestones`,
    {
      method: "POST",
      cookie,
      body: { title: "Bad status", status: "DONE" },
    },
  );
  assert.equal(invalidStatus.response.status, 400);

  const forcedInitialStatus = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}/milestones`,
    {
      method: "POST",
      cookie,
      body: { title: "Premature completion", status: "COMPLETED" },
    },
  );
  assert.equal(forcedInitialStatus.response.status, 400);
  assert.equal(forcedInitialStatus.json.error.code, "VALIDATION_ERROR");

  const completed = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}/milestones/${IDS.milestone}`,
    {
      method: "PATCH",
      cookie,
      body: { status: "COMPLETED" },
    },
  );
  assert.equal(completed.response.status, 200);
  assert.equal(completed.json.data.milestone.status, "COMPLETED");
  assert.ok(completed.json.data.milestone.completedAt);

  const invalidTransition = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}/milestones/${IDS.milestone}`,
    {
      method: "PATCH",
      cookie,
      body: { status: "BLOCKED" },
    },
  );
  assert.equal(invalidTransition.response.status, 409);
  assert.equal(
    invalidTransition.json.error.code,
    "INVALID_STATUS_TRANSITION",
  );

  const invalidDueDate = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}/milestones/${IDS.milestoneCompleted}`,
    {
      method: "PATCH",
      cookie,
      body: { dueDate: "2026-12-15" },
    },
  );
  assert.equal(invalidDueDate.response.status, 400);

  const missing = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}/milestones/64b000000000000000000098`,
    {
      method: "PATCH",
      cookie,
      body: { title: "Missing milestone" },
    },
  );
  assert.equal(missing.response.status, 404);

  const missingProject = await jsonRequest(
    server.baseUrl,
    "/api/v1/admin/projects/64b000000000000000000098/milestones",
    { cookie },
  );
  assert.equal(missingProject.response.status, 404);
});

test("admin project updates default to internal and portal exposes only CLIENT updates", async (t) => {
  const server = await startPortalTestServer();
  t.after(() => server.close());

  const admin = await createSignedInUser(server, "ADMIN");
  const linked = await linkClientUser({
    app: server,
    auth: server.auth,
    data: server.data,
  });

  const internal = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}/updates`,
    {
      method: "POST",
      cookie: admin.cookie,
      body: {
        title: "Internal coordination",
        body: "Do not share this with the client.",
      },
    },
  );
  assert.equal(internal.response.status, 201);
  assert.equal(internal.json.data.update.visibility, "INTERNAL");

  const clientVisible = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}/updates`,
    {
      method: "POST",
      cookie: admin.cookie,
      body: {
        title: "Design approved",
        body: "The client approved the design direction.",
        visibility: "CLIENT",
      },
    },
  );
  assert.equal(clientVisible.response.status, 201);
  assert.equal(clientVisible.json.data.update.visibility, "CLIENT");
  assert.equal(clientVisible.json.data.update.authorName, "ADMIN User");

  const portalUpdates = await jsonRequest(
    server.baseUrl,
    `/api/v1/portal/projects/${IDS.project}/updates`,
    { cookie: linked.cookie },
  );
  assert.equal(portalUpdates.response.status, 200);
  assert.equal(
    portalUpdates.json.data.items.some(
      (update) => update.id === internal.json.data.update.id,
    ),
    false,
  );
  assert.equal(
    portalUpdates.json.data.items.some(
      (update) => update.id === clientVisible.json.data.update.id,
    ),
    true,
  );

  const adminList = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}/updates`,
    { cookie: admin.cookie },
  );
  assert.equal(adminList.response.status, 200);
  assert.equal(
    adminList.json.data.items.some(
      (update) => update.id === internal.json.data.update.id,
    ),
    true,
  );

  const missingProject = await jsonRequest(
    server.baseUrl,
    "/api/v1/admin/projects/64b000000000000000000098/updates",
    { method: "POST", cookie: admin.cookie, body: { title: "Missing", body: "Nope" } },
  );
  assert.equal(missingProject.response.status, 404);

  const missingUpdate = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}/updates/64b000000000000000000098`,
    {
      method: "PATCH",
      cookie: admin.cookie,
      body: { title: "Missing update" },
    },
  );
  assert.equal(missingUpdate.response.status, 404);
});

test("admin can link and unlink an existing CLIENT account explicitly", async (t) => {
  const server = await startPortalTestServer();
  t.after(() => server.close());

  const admin = await createSignedInUser(server, "ADMIN");
  const target = await createSignedInUser(server, "CLIENT");
  const targetTwo = await createSignedInUser(server, "CLIENT");
  const adminTarget = await createSignedInUser(server, "ADMIN");
  addSecondClient(server.data);

  const linked = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/clients/${IDS.client}/portal-access`,
    {
      method: "PATCH",
      cookie: admin.cookie,
      body: { email: target.email },
    },
  );
  assert.equal(linked.response.status, 200);
  assert.equal(linked.json.data.portalAccess.email, target.email);
  assert.equal(linked.json.data.portalAccess.missing, false);

  const detail = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/clients/${IDS.client}`,
    { cookie: admin.cookie },
  );
  assert.equal(detail.response.status, 200);
  assert.equal(detail.json.data.portalAccess.email, target.email);

  const alreadyLinked = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/clients/${SECOND_CLIENT_ID}/portal-access`,
    {
      method: "PATCH",
      cookie: admin.cookie,
      body: { email: target.email },
    },
  );
  assert.equal(alreadyLinked.response.status, 409);
  assert.equal(
    alreadyLinked.json.error.code,
    "PORTAL_USER_ALREADY_LINKED",
  );

  const wrongRole = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/clients/${SECOND_CLIENT_ID}/portal-access`,
    {
      method: "PATCH",
      cookie: admin.cookie,
      body: { email: adminTarget.email },
    },
  );
  assert.equal(wrongRole.response.status, 409);
  assert.equal(wrongRole.json.error.code, "PORTAL_USER_NOT_CLIENT");

  const unknown = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/clients/${SECOND_CLIENT_ID}/portal-access`,
    {
      method: "PATCH",
      cookie: admin.cookie,
      body: { email: "nobody@example.com" },
    },
  );
  assert.equal(unknown.response.status, 404);
  assert.equal(unknown.json.error.code, "PORTAL_USER_NOT_FOUND");

  const linkSecond = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/clients/${SECOND_CLIENT_ID}/portal-access`,
    {
      method: "PATCH",
      cookie: admin.cookie,
      body: { email: targetTwo.email },
    },
  );
  assert.equal(linkSecond.response.status, 200);

  const unlinked = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/clients/${IDS.client}/portal-access`,
    {
      method: "PATCH",
      cookie: admin.cookie,
      body: { email: null },
    },
  );
  assert.equal(unlinked.response.status, 200);
  assert.equal(unlinked.json.data.portalAccess, null);

  const afterUnlink = await jsonRequest(
    server.baseUrl,
    `/api/v1/portal/dashboard`,
    { cookie: target.cookie },
  );
  assert.equal(afterUnlink.response.status, 403);
  assert.equal(afterUnlink.json.error.code, "PORTAL_ACCESS_DENIED");
});

test("TEAM_MEMBER and CLIENT cannot use privileged project endpoints", async (t) => {
  const server = await startPortalTestServer();
  t.after(() => server.close());

  const teamMember = await createSignedInUser(server, "TEAM_MEMBER");
  const client = await createSignedInUser(server, "CLIENT");

  const memberAdmin = await jsonRequest(
    server.baseUrl,
    "/api/v1/admin/projects",
    { cookie: teamMember.cookie },
  );
  assert.equal(memberAdmin.response.status, 403);

  const memberPortal = await jsonRequest(
    server.baseUrl,
    "/api/v1/portal/projects",
    { cookie: teamMember.cookie },
  );
  assert.equal(memberPortal.response.status, 403);

  const clientAdminWrite = await jsonRequest(
    server.baseUrl,
    `/api/v1/admin/projects/${IDS.project}/status`,
    {
      method: "PATCH",
      cookie: client.cookie,
      body: { status: "COMPLETED" },
    },
  );
  assert.equal(clientAdminWrite.response.status, 403);

  const anonymous = await jsonRequest(
    server.baseUrl,
    "/api/v1/portal/projects",
  );
  assert.equal(anonymous.response.status, 401);
});
