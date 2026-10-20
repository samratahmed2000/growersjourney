import test from "node:test";
import assert from "node:assert/strict";
import {
  IDS,
  createFakeAdminRepositories,
  createSignedInUser,
  jsonRequest,
  startAdminTestServer,
} from "./helpers/admin.js";

async function serverWithFakes() {
  const { repositories, data } = createFakeAdminRepositories();
  const app = await startAdminTestServer(repositories);
  return { app, repositories, data };
}

test("admin API requires authentication and the ADMIN role", async (t) => {
  const { app } = await serverWithFakes();
  t.after(() => app.close());

  const anonymous = await jsonRequest(app.baseUrl, "/api/v1/admin/dashboard");
  assert.equal(anonymous.response.status, 401);

  for (const role of ["TEAM_MEMBER", "CLIENT"]) {
    const { cookie } = await createSignedInUser(app, role);
    const denied = await jsonRequest(app.baseUrl, "/api/v1/admin/dashboard", {
      cookie,
    });
    assert.equal(denied.response.status, 403);
    assert.equal(denied.json?.error?.code, "FORBIDDEN");
    assert.equal(denied.json?.data, undefined);
  }

  const { cookie } = await createSignedInUser(app, "ADMIN");
  const allowed = await jsonRequest(app.baseUrl, "/api/v1/admin/dashboard", {
    cookie,
  });
  assert.equal(allowed.response.status, 200);
  assert.equal(allowed.json?.data?.inquiries?.total, 1);
});

test("admin writes reject missing or untrusted origins", async (t) => {
  const { app } = await serverWithFakes();
  t.after(() => app.close());
  const { cookie } = await createSignedInUser(app, "ADMIN");

  const noOrigin = await jsonRequest(app.baseUrl, "/api/v1/admin/services", {
    method: "POST",
    cookie,
    origin: null,
    body: {
      slug: "new-service",
      title: "New Service",
      summary: "A sufficiently long service summary.",
    },
  });
  assert.equal(noOrigin.response.status, 403);
  assert.equal(noOrigin.json?.error?.code, "INVALID_ORIGIN");

  const evilOrigin = await jsonRequest(app.baseUrl, "/api/v1/admin/services", {
    method: "POST",
    cookie,
    origin: "https://evil.example",
    body: {
      slug: "new-service",
      title: "New Service",
      summary: "A sufficiently long service summary.",
    },
  });
  assert.equal(evilOrigin.response.status, 403);
});

test("inquiries list, paginate, and reject invalid query values", async (t) => {
  const { app } = await serverWithFakes();
  t.after(() => app.close());
  const { cookie } = await createSignedInUser(app, "ADMIN");

  const list = await jsonRequest(
    app.baseUrl,
    "/api/v1/admin/inquiries?page=1&limit=20&status=NEW&sort=createdAt&order=desc",
    { cookie },
  );
  assert.equal(list.response.status, 200);
  assert.equal(list.json?.data?.items?.length, 1);
  assert.equal(list.json?.pagination?.total, 1);
  assert.equal(list.json?.data?.items?.[0]?.email, "person@example.com");

  const badLimit = await jsonRequest(
    app.baseUrl,
    "/api/v1/admin/inquiries?limit=101",
    { cookie },
  );
  assert.equal(badLimit.response.status, 400);
  assert.equal(badLimit.json?.error?.code, "VALIDATION_ERROR");

  const badSort = await jsonRequest(
    app.baseUrl,
    "/api/v1/admin/inquiries?sort=password",
    { cookie },
  );
  assert.equal(badSort.response.status, 400);

  const badId = await jsonRequest(
    app.baseUrl,
    "/api/v1/admin/inquiries/not-an-id",
    { cookie },
  );
  assert.equal(badId.response.status, 400);
});

test("inquiry status updates are validated against the transition map", async (t) => {
  const { app, data } = await serverWithFakes();
  t.after(() => app.close());
  const { cookie } = await createSignedInUser(app, "ADMIN");

  const invalid = await jsonRequest(
    app.baseUrl,
    `/api/v1/admin/inquiries/${IDS.inquiry}`,
    {
      method: "PATCH",
      cookie,
      body: { status: "QUALIFIED" },
    },
  );
  assert.equal(invalid.response.status, 409);
  assert.equal(invalid.json?.error?.code, "INVALID_STATUS_TRANSITION");
  assert.equal(data.inquiries[0].status, "NEW");

  const valid = await jsonRequest(
    app.baseUrl,
    `/api/v1/admin/inquiries/${IDS.inquiry}`,
    {
      method: "PATCH",
      cookie,
      body: { status: "REVIEWING" },
    },
  );
  assert.equal(valid.response.status, 200);
  assert.equal(valid.json?.data?.inquiry?.status, "REVIEWING");
  assert.deepEqual(valid.json?.data?.inquiry?.allowedNextStatuses, [
    "QUALIFIED",
    "CLOSED",
  ]);

  const unknownField = await jsonRequest(
    app.baseUrl,
    `/api/v1/admin/inquiries/${IDS.inquiry}`,
    {
      method: "PATCH",
      cookie,
      body: { status: "CLOSED", role: "ADMIN" },
    },
  );
  assert.equal(unknownField.response.status, 400);
});

test("a concurrent inquiry status change returns a conflict", async (t) => {
  const { repositories } = createFakeAdminRepositories();
  repositories.inquiries.updateStatus = async () => null;
  const app = await startAdminTestServer(repositories);
  t.after(() => app.close());
  const { cookie } = await createSignedInUser(app, "ADMIN");

  const response = await jsonRequest(
    app.baseUrl,
    `/api/v1/admin/inquiries/${IDS.inquiry}`,
    {
      method: "PATCH",
      cookie,
      body: { status: "REVIEWING" },
    },
  );

  assert.equal(response.response.status, 409);
  assert.equal(response.json?.error?.code, "STATUS_CHANGED");
});

test("client creation rejects duplicate emails and returns safe records", async (t) => {
  const { app } = await serverWithFakes();
  t.after(() => app.close());
  const { cookie } = await createSignedInUser(app, "ADMIN");

  const duplicate = await jsonRequest(app.baseUrl, "/api/v1/admin/clients", {
    method: "POST",
    cookie,
    body: {
      displayName: "Another Client",
      primaryEmail: "CLIENT@example.com",
    },
  });
  assert.equal(duplicate.response.status, 409);
  assert.equal(duplicate.json?.error?.code, "DUPLICATE_CLIENT_EMAIL");
  assert.equal(duplicate.json?.data, undefined);

  const created = await jsonRequest(app.baseUrl, "/api/v1/admin/clients", {
    method: "POST",
    cookie,
    body: {
      displayName: "New Client",
      primaryEmail: "new@example.com",
      status: "ACTIVE",
    },
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.json?.data?.client?.primaryEmail, "new@example.com");
  assert.equal(created.json?.data?.client?.updatedBy, undefined);

  const detail = await jsonRequest(
    app.baseUrl,
    `/api/v1/admin/clients/${IDS.client}`,
    { cookie },
  );
  assert.equal(detail.response.status, 200);
  assert.equal(detail.json?.data?.projects?.[0]?.name, "Test Project");
});

test("service creation, duplicate slug, and archive are safe", async (t) => {
  const { app, data } = await serverWithFakes();
  t.after(() => app.close());
  const { cookie } = await createSignedInUser(app, "ADMIN");

  const duplicate = await jsonRequest(app.baseUrl, "/api/v1/admin/services", {
    method: "POST",
    cookie,
    body: {
      slug: "web-application-development",
      title: "Duplicate",
      summary: "A sufficiently long summary.",
    },
  });
  assert.equal(duplicate.response.status, 409);
  assert.equal(duplicate.json?.error?.code, "DUPLICATE_SLUG");

  const created = await jsonRequest(app.baseUrl, "/api/v1/admin/services", {
    method: "POST",
    cookie,
    body: {
      slug: "automation-audit",
      title: "Automation Audit",
      summary: "A focused review of repetitive business workflows.",
      isPublished: true,
    },
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.json?.data?.service?.slug, "automation-audit");

  const archived = await jsonRequest(
    app.baseUrl,
    `/api/v1/admin/services/${IDS.service}`,
    { method: "DELETE", cookie },
  );
  assert.equal(archived.response.status, 200);
  assert.equal(archived.json?.data?.service?.isArchived, true);
  assert.equal(archived.json?.data?.service?.isPublished, false);
  assert.equal(data.services[0].isArchived, true);
});

test("portfolio validates URLs and sets publishedAt on publication", async (t) => {
  const { app } = await serverWithFakes();
  t.after(() => app.close());
  const { cookie } = await createSignedInUser(app, "ADMIN");

  const invalidUrl = await jsonRequest(
    app.baseUrl,
    "/api/v1/admin/portfolio",
    {
      method: "POST",
      cookie,
      body: {
        slug: "bad-url-concept",
        title: "Bad URL Concept",
        summary: "A sufficiently long summary.",
        liveUrl: "javascript:alert(1)",
      },
    },
  );
  assert.equal(invalidUrl.response.status, 400);

  const published = await jsonRequest(
    app.baseUrl,
    `/api/v1/admin/portfolio/${IDS.portfolio}`,
    {
      method: "PATCH",
      cookie,
      body: { isPublished: true },
    },
  );
  assert.equal(published.response.status, 200);
  assert.equal(published.json?.data?.portfolio?.isPublished, true);
  assert.ok(published.json?.data?.portfolio?.publishedAt);

  const featured = await jsonRequest(
    app.baseUrl,
    `/api/v1/admin/portfolio/${IDS.portfolio}`,
    {
      method: "PATCH",
      cookie,
      body: { isFeatured: true },
    },
  );
  assert.equal(featured.response.status, 200);
  assert.equal(featured.json?.data?.portfolio?.isFeatured, true);

  const unpublished = await jsonRequest(
    app.baseUrl,
    `/api/v1/admin/portfolio/${IDS.portfolio}`,
    {
      method: "PATCH",
      cookie,
      body: { isPublished: false },
    },
  );
  assert.equal(unpublished.response.status, 200);
  assert.equal(unpublished.json?.data?.portfolio?.isPublished, false);
  assert.equal(unpublished.json?.data?.portfolio?.isFeatured, false);

  const featuredWhileDraft = await jsonRequest(
    app.baseUrl,
    `/api/v1/admin/portfolio/${IDS.portfolio}`,
    {
      method: "PATCH",
      cookie,
      body: { isPublished: false, isFeatured: true },
    },
  );
  assert.equal(featuredWhileDraft.response.status, 409);
});

test("project listing and detail return client summaries", async (t) => {
  const { app } = await serverWithFakes();
  t.after(() => app.close());
  const { cookie } = await createSignedInUser(app, "ADMIN");

  const list = await jsonRequest(
    app.baseUrl,
    `/api/v1/admin/projects?clientId=${IDS.client}`,
    { cookie },
  );
  assert.equal(list.response.status, 200);
  assert.equal(list.json?.data?.items?.[0]?.client?.displayName, "Test Client");

  const detail = await jsonRequest(
    app.baseUrl,
    `/api/v1/admin/projects/${IDS.project}`,
    { cookie },
  );
  assert.equal(detail.response.status, 200);
  assert.equal(detail.json?.data?.project?.status, "IN_PROGRESS");
});

test("repository failures become a generic 500 without internal details", async (t) => {
  const { repositories } = createFakeAdminRepositories();
  repositories.dashboard = {
    async getSummary() {
      throw new Error("mongodb://user:password@secret-host/database");
    },
  };
  const app = await startAdminTestServer(repositories);
  t.after(() => app.close());
  const { cookie } = await createSignedInUser(app, "ADMIN");

  const response = await jsonRequest(app.baseUrl, "/api/v1/admin/dashboard", {
    cookie,
  });
  assert.equal(response.response.status, 500);
  assert.equal(response.json?.error?.code, "INTERNAL_ERROR");
  assert.equal(response.json?.error?.message, "Something went wrong.");
  assert.equal(JSON.stringify(response.json).includes("secret-host"), false);
});
