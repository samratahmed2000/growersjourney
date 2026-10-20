import test from "node:test";
import assert from "node:assert/strict";
import {
  assertResourceOwner,
  assertRole,
  ownedByQuery,
  toSafeUser,
} from "../auth/access-control.js";
import {
  createRequireAuth,
  requireRole,
  requireTrustedOrigin,
} from "../middleware/auth.js";
import {
  createTestUser,
  getJson,
  signIn,
  startAuthTestServer,
} from "./helpers/auth.js";

/**
 * Authorization tests.
 *
 * The HTTP matrix proves that role checks run on the server, independent of any
 * Next.js route guard. The unit tests cover the object-level helpers that future
 * project/invoice routes will use, including Client A vs Client B isolation.
 */

const ACCESS_MATRIX = [
  { role: "ADMIN", admin: 200, portal: 403 },
  { role: "TEAM_MEMBER", admin: 200, portal: 403 },
  { role: "CLIENT", admin: 403, portal: 200 },
];

for (const entry of ACCESS_MATRIX) {
  test(`${entry.role} receives the documented area permissions`, async (t) => {
    const app = await startAuthTestServer();
    t.after(() => app.close());

    const { email } = await createTestUser(app.auth, { role: entry.role });
    const { cookie } = await signIn(app.baseUrl, { email });

    const admin = await getJson(app.baseUrl, "/api/v1/admin/access", {
      cookie,
    });
    const portal = await getJson(app.baseUrl, "/api/v1/portal/access", {
      cookie,
    });

    assert.equal(admin.response.status, entry.admin);
    assert.equal(portal.response.status, entry.portal);

    // A refusal must not leak the protected payload.
    if (entry.admin === 403) {
      assert.equal(admin.json?.error?.code, "FORBIDDEN");
      assert.equal(admin.json?.data, undefined);
    }
    if (entry.portal === 403) {
      assert.equal(portal.json?.error?.code, "FORBIDDEN");
      assert.equal(portal.json?.data, undefined);
    }

    // Success must return only the area name and the role the server resolved.
    if (entry.admin === 200) {
      assert.equal(admin.json?.data?.area, "admin");
      assert.equal(admin.json?.data?.role, entry.role);
    }
    if (entry.portal === 200) {
      assert.equal(portal.json?.data?.area, "portal");
      assert.equal(portal.json?.data?.role, entry.role);
    }
  });
}

test("every protected endpoint rejects an unauthenticated caller", async (t) => {
  const app = await startAuthTestServer();
  t.after(() => app.close());

  for (const path of [
    "/api/v1/auth/me",
    "/api/v1/admin/access",
    "/api/v1/portal/access",
  ]) {
    const { response, json } = await getJson(app.baseUrl, path);
    assert.equal(response.status, 401, path);
    assert.equal(json?.error?.code, "UNAUTHENTICATED", path);
  }
});

test("a CLIENT cannot use an ADMIN session token from another account", async (t) => {
  const app = await startAuthTestServer();
  t.after(() => app.close());

  const admin = await createTestUser(app.auth, { role: "ADMIN" });
  const client = await createTestUser(app.auth, { role: "CLIENT" });

  const adminSignIn = await signIn(app.baseUrl, { email: admin.email });
  const clientSignIn = await signIn(app.baseUrl, { email: client.email });

  const adminAccess = await getJson(app.baseUrl, "/api/v1/admin/access", {
    cookie: adminSignIn.cookie,
  });
  const clientAccess = await getJson(app.baseUrl, "/api/v1/admin/access", {
    cookie: clientSignIn.cookie,
  });

  assert.equal(adminAccess.response.status, 200);
  assert.equal(clientAccess.response.status, 403);

  // Changing a header or query parameter does not promote the client session.
  const spoofed = await getJson(
    app.baseUrl,
    "/api/v1/admin/access?role=ADMIN&userId=" + admin.user.id,
    {
      cookie: clientSignIn.cookie,
      headers: { "x-user-role": "ADMIN", "x-user-id": admin.user.id },
    },
  );

  assert.equal(spoofed.response.status, 403);
});

test("a client sees only their own records at the query level", () => {
  const clientA = { id: "client-a", role: "CLIENT" };
  const clientB = { id: "client-b", role: "CLIENT" };

  const resources = [
    { id: "project-1", clientUserId: clientA.id, title: "A's project" },
    { id: "project-2", clientUserId: clientB.id, title: "B's project" },
    { id: "project-3", clientUserId: clientA.id, title: "A's other project" },
  ];

  const query = ownedByQuery(clientA);
  assert.deepEqual(query, { clientUserId: clientA.id });

  const visible = resources.filter(
    (resource) => resource.clientUserId === query.clientUserId,
  );

  assert.deepEqual(
    visible.map((resource) => resource.id),
    ["project-1", "project-3"],
  );
  assert.ok(visible.every((resource) => resource.clientUserId !== clientB.id));
});

test("cross-client object access is denied without revealing existence", () => {
  const clientA = { id: "client-a", role: "CLIENT" };
  const clientB = { id: "client-b", role: "CLIENT" };

  const own = { id: "invoice-1", clientUserId: clientA.id, total: 1000 };
  const other = { id: "invoice-2", clientUserId: clientB.id, total: 2000 };

  assert.equal(assertResourceOwner({ user: clientA, resource: own }), own);

  for (const resource of [
    other,
    null,
    undefined,
    {},
    { id: "invoice-3", clientUserId: 42 },
  ]) {
    assert.throws(
      () => assertResourceOwner({ user: clientA, resource }),
      (error) => {
        assert.equal(error.status, 404);
        assert.equal(error.code, "NOT_FOUND");
        assert.match(error.message, /not found/i);
        // The error must not reveal whose record it was.
        assert.ok(!error.message.includes("client-b"));
        return true;
      },
    );
  }
});

test("staff do not get implicit ownership of client records", () => {
  const admin = { id: "admin-1", role: "ADMIN" };
  const team = { id: "team-1", role: "TEAM_MEMBER" };
  const resource = { id: "invoice-1", clientUserId: "client-a" };

  for (const user of [admin, team]) {
    assert.throws(
      () => assertResourceOwner({ user, resource }),
      (error) => error.status === 404 && error.code === "NOT_FOUND",
    );

    assert.throws(
      () => ownedByQuery(user),
      (error) => error.status === 403 && error.code === "FORBIDDEN",
    );
  }
});

test("role checks fail closed for unknown or missing roles", () => {
  assert.throws(
    () => assertRole(undefined, ["ADMIN"]),
    (error) => error.status === 403,
  );
  assert.throws(
    () => assertRole({ role: "SUPERUSER" }, ["ADMIN"]),
    (error) => error.status === 403,
  );
  assert.throws(
    () => assertRole({ role: "client" }, ["CLIENT"]),
    (error) => error.status === 403,
  );

  assert.equal(assertRole({ role: "ADMIN" }, ["ADMIN"]), "ADMIN");
});

test("the safe user projection strips passwords, tokens, and provider data", () => {
  const safe = toSafeUser({
    id: "user-1",
    email: "person@example.com",
    name: "Person",
    role: "CLIENT",
    password: "hash",
    token: "session-token",
    accounts: [{ providerId: "credential" }],
  });

  assert.deepEqual(safe, {
    id: "user-1",
    email: "person@example.com",
    name: "Person",
    role: "CLIENT",
  });
  assert.ok(!Object.hasOwn(safe, "password"));
  assert.ok(!Object.hasOwn(safe, "token"));
});

test("requireAuth fails closed when no Better Auth instance is supplied", () => {
  assert.throws(() => createRequireAuth({}), /requires a Better Auth instance/);
});

test("requireRole rejects missing identity and unlisted roles", () => {
  const guard = requireRole("ADMIN");

  let error;
  guard({}, {}, (value) => {
    error = value;
  });
  assert.equal(error.status, 401);

  error = undefined;
  guard({ auth: { user: { role: "CLIENT" } } }, {}, (value) => {
    error = value;
  });
  assert.equal(error.status, 403);

  let passed = false;
  guard({ auth: { user: { role: "ADMIN" } } }, {}, () => {
    passed = true;
  });
  assert.equal(passed, true);
});

test("requireTrustedOrigin protects writes without blocking reads", () => {
  const guard = requireTrustedOrigin({
    allowedOrigins: ["http://localhost:3000"],
  });

  let error;
  guard({ method: "GET", get: () => undefined }, {}, (value) => {
    error = value;
  });
  assert.equal(error, undefined);

  error = undefined;
  guard({ method: "POST", get: () => undefined }, {}, (value) => {
    error = value;
  });
  assert.equal(error.status, 403);
  assert.equal(error.code, "INVALID_ORIGIN");

  error = undefined;
  guard(
    { method: "POST", get: () => "https://evil.example" },
    {},
    (value) => {
      error = value;
    },
  );
  assert.equal(error.status, 403);

  let passed = false;
  guard(
    { method: "DELETE", get: () => "http://localhost:3000/" },
    {},
    () => {
      passed = true;
    },
  );
  assert.equal(passed, true);
});
