import test from "node:test";
import assert from "node:assert/strict";
import {
  TEST_PASSWORD,
  TRUSTED_ORIGIN,
  cookieHeader,
  createTestAuth,
  createTestUser,
  getJson,
  nextEmail,
  signIn,
  startAuthTestServer,
} from "./helpers/auth.js";

/**
 * HTTP tests for the Better Auth session flow.
 *
 * These use the official in-memory adapter, so the session is really created,
 * looked up in storage, expired, and revoked. No MongoDB connection is opened.
 */

test("public sign-up is disabled and creates no account", async (t) => {
  const app = await startAuthTestServer();
  t.after(() => app.close());

  const response = await fetch(`${app.baseUrl}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: TRUSTED_ORIGIN,
    },
    body: JSON.stringify({
      email: nextEmail("signup"),
      password: TEST_PASSWORD,
      name: "Should Not Exist",
      // Even an attempted role escalation must not matter: the endpoint is off.
      role: "ADMIN",
    }),
  });

  const json = await response.json().catch(() => null);

  assert.equal(response.status, 400);
  assert.equal(json?.code, "EMAIL_PASSWORD_SIGN_UP_DISABLED");
  assert.equal(app.db.user.length, 0);
  assert.equal(app.db.account.length, 0);
});

test("valid credentials create a session and the API returns a safe profile", async (t) => {
  const app = await startAuthTestServer();
  t.after(() => app.close());

  const { email } = await createTestUser(app.auth, {
    role: "CLIENT",
    name: "Portal Person",
  });

  const { response, json, cookie, setCookies } = await signIn(app.baseUrl, {
    email,
  });

  assert.equal(response.status, 200);
  assert.ok(cookie.startsWith("gj.session_token="));
  assert.equal(json?.user?.role, "CLIENT");

  const rawCookie = setCookies.join("\n");
  assert.match(rawCookie, /HttpOnly/i);
  assert.match(rawCookie, /SameSite=Lax/i);
  assert.match(rawCookie, /Path=\//i);
  assert.doesNotMatch(rawCookie, /;\s*Secure/i, "Secure is off in development");
  assert.doesNotMatch(rawCookie, /__Secure-/i);

  const me = await getJson(app.baseUrl, "/api/v1/auth/me", { cookie });

  assert.equal(me.response.status, 200);
  assert.equal(me.json?.success, true);
  assert.deepEqual(Object.keys(me.json.data.user).sort(), [
    "email",
    "id",
    "name",
    "role",
  ]);
  assert.equal(me.json.data.user.email, email);
  assert.equal(me.json.data.user.name, "Portal Person");
  assert.equal(me.json.data.user.role, "CLIENT");

  // The safe profile must never echo the session token, password, or account
  // row. `expiresAt` is the only session detail returned.
  const raw = JSON.stringify(me.json);
  assert.ok(!raw.includes("token"));
  assert.ok(!raw.includes("password"));
  assert.ok(!raw.includes("providerId"));
  assert.deepEqual(Object.keys(me.json.data.session), ["expiresAt"]);
});

test("wrong password and unknown email return the same generic error", async (t) => {
  const app = await startAuthTestServer();
  t.after(() => app.close());

  const { email } = await createTestUser(app.auth);

  const wrongPassword = await signIn(app.baseUrl, {
    email,
    password: "this is not the password",
  });
  const unknownEmail = await signIn(app.baseUrl, {
    email: nextEmail("missing"),
  });

  assert.equal(wrongPassword.response.status, 401);
  assert.equal(unknownEmail.response.status, 401);
  assert.equal(wrongPassword.json?.code, "INVALID_EMAIL_OR_PASSWORD");
  assert.equal(unknownEmail.json?.code, "INVALID_EMAIL_OR_PASSWORD");
  assert.equal(wrongPassword.json?.message, unknownEmail.json?.message);
  assert.equal(wrongPassword.cookie, "");
  assert.equal(unknownEmail.cookie, "");
});

test("missing, malformed, and expired sessions are rejected", async (t) => {
  const app = await startAuthTestServer();
  t.after(() => app.close());

  const anonymous = await getJson(app.baseUrl, "/api/v1/auth/me");
  assert.equal(anonymous.response.status, 401);
  assert.equal(anonymous.json?.error?.code, "UNAUTHENTICATED");

  const malformed = await getJson(app.baseUrl, "/api/v1/auth/me", {
    cookie: "gj.session_token=not-a-real-token",
  });
  assert.equal(malformed.response.status, 401);
  assert.equal(malformed.json?.error?.code, "UNAUTHENTICATED");

  const { email } = await createTestUser(app.auth);
  const { cookie } = await signIn(app.baseUrl, { email });

  // Before expiry the session works.
  const before = await getJson(app.baseUrl, "/api/v1/auth/me", { cookie });
  assert.equal(before.response.status, 200);

  // Move the stored session into the past. Better Auth must reject it on the
  // next request rather than trusting the still-valid-looking cookie.
  const stored = app.db.session[0];
  assert.ok(stored, "expected a stored session");
  stored.expiresAt = new Date(Date.now() - 1000);

  const expired = await getJson(app.baseUrl, "/api/v1/auth/me", { cookie });
  assert.equal(expired.response.status, 401);
  assert.equal(expired.json?.error?.code, "UNAUTHENTICATED");
});

test("logout revokes the session for subsequent API requests", async (t) => {
  const app = await startAuthTestServer();
  t.after(() => app.close());

  const { email } = await createTestUser(app.auth);
  const { cookie } = await signIn(app.baseUrl, { email });

  const before = await getJson(app.baseUrl, "/api/v1/auth/me", { cookie });
  assert.equal(before.response.status, 200);

  const signOut = await fetch(`${app.baseUrl}/api/auth/sign-out`, {
    method: "POST",
    headers: { cookie, origin: TRUSTED_ORIGIN },
  });

  assert.equal(signOut.status, 200);

  const after = await getJson(app.baseUrl, "/api/v1/auth/me", { cookie });
  assert.equal(after.response.status, 401);
  assert.equal(after.json?.error?.code, "UNAUTHENTICATED");
  assert.equal(app.db.session.length, 0);
});

test("cross-site sign-in and sign-out attempts are rejected by CSRF checks", async (t) => {
  const app = await startAuthTestServer();
  t.after(() => app.close());

  const { email } = await createTestUser(app.auth);

  const crossSiteSignIn = await signIn(app.baseUrl, {
    email,
    origin: "https://evil.example",
  });

  assert.equal(crossSiteSignIn.response.status, 403);
  assert.equal(crossSiteSignIn.json?.code, "INVALID_ORIGIN");
  assert.equal(crossSiteSignIn.cookie, "");

  const { cookie } = await signIn(app.baseUrl, { email });
  assert.ok(cookie);

  const crossSiteSignOut = await fetch(`${app.baseUrl}/api/auth/sign-out`, {
    method: "POST",
    headers: { cookie, origin: "https://evil.example" },
  });

  assert.equal(crossSiteSignOut.status, 403);

  // The failed cross-site logout must not have revoked the real session.
  const stillSignedIn = await getJson(app.baseUrl, "/api/v1/auth/me", {
    cookie,
  });
  assert.equal(stillSignedIn.response.status, 200);
});

test("repeated failed sign-ins are rate limited", async (t) => {
  const { auth } = createTestAuth({ rateLimitEnabled: true, signInMax: 2 });
  const app = await startAuthTestServer({ auth });
  t.after(() => app.close());

  const { email } = await createTestUser(auth);

  const first = await signIn(app.baseUrl, {
    email,
    password: "wrong password one",
  });
  const second = await signIn(app.baseUrl, {
    email,
    password: "wrong password two",
  });
  const third = await signIn(app.baseUrl, {
    email,
    password: "wrong password three",
  });

  assert.equal(first.response.status, 401);
  assert.equal(second.response.status, 401);
  assert.equal(third.response.status, 429);
  assert.match(String(third.json?.message ?? ""), /too many/i);

  // Even the correct password is refused while the bucket is exhausted. This
  // is what stops online password guessing.
  const correct = await signIn(app.baseUrl, { email });
  assert.equal(correct.response.status, 429);
});

test("unknown roles fail closed even with an otherwise valid session", async (t) => {
  const app = await startAuthTestServer();
  t.after(() => app.close());

  const { email } = await createTestUser(app.auth, { role: "CLIENT" });
  const { cookie } = await signIn(app.baseUrl, { email });

  // Simulate a corrupted or manually edited role. Application code must not
  // guess, lower-case, or fall back to CLIENT.
  app.db.user.find((user) => user.email === email).role = "SUPERUSER";

  const me = await getJson(app.baseUrl, "/api/v1/auth/me", { cookie });

  assert.equal(me.response.status, 403);
  assert.equal(me.json?.error?.code, "FORBIDDEN");
});

test("public health and inquiry routes stay public when auth is mounted", async (t) => {
  const repository = {
    async create() {
      return { id: "fake-id" };
    },
  };

  const app = await startAuthTestServer({
    appOptions: { inquiryRepository: repository },
  });
  t.after(() => app.close());

  const health = await getJson(app.baseUrl, "/api/v1/health");
  assert.equal(health.response.status, 200);
  assert.equal(health.json?.data?.status, "ok");

  const inquiry = await fetch(`${app.baseUrl}/api/v1/inquiries`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Public Visitor",
      email: "visitor@example.com",
      service: "business-automation",
      projectDescription:
        "We would like to automate a repetitive weekly report.",
    }),
  });

  assert.equal(inquiry.status, 201);
});

test("a cookie from one user cannot be replayed as another user", async (t) => {
  const app = await startAuthTestServer();
  t.after(() => app.close());

  const first = await createTestUser(app.auth, { role: "CLIENT" });
  const second = await createTestUser(app.auth, { role: "CLIENT" });

  const firstSignIn = await signIn(app.baseUrl, { email: first.email });
  const secondSignIn = await signIn(app.baseUrl, { email: second.email });

  const firstMe = await getJson(app.baseUrl, "/api/v1/auth/me", {
    cookie: firstSignIn.cookie,
  });
  const secondMe = await getJson(app.baseUrl, "/api/v1/auth/me", {
    cookie: secondSignIn.cookie,
  });

  assert.equal(firstMe.response.status, 200);
  assert.equal(secondMe.response.status, 200);
  assert.notEqual(firstMe.json.data.user.id, secondMe.json.data.user.id);
  assert.equal(firstMe.json.data.user.email, first.email);
  assert.equal(secondMe.json.data.user.email, second.email);

  // Mixing a valid session with a different user's id in a header/query must
  // have no effect: the identity comes only from the verified session.
  const spoofed = await getJson(app.baseUrl, "/api/v1/auth/me", {
    cookie: firstSignIn.cookie,
    headers: {
      "x-user-id": second.user.id,
      "x-user-role": "ADMIN",
    },
  });

  assert.equal(spoofed.response.status, 200);
  assert.equal(spoofed.json.data.user.id, first.user.id);
  assert.equal(spoofed.json.data.user.role, "CLIENT");
});

test("cookie helper ignores an empty Set-Cookie response", () => {
  const fake = { headers: { getSetCookie: () => [], get: () => null } };
  assert.equal(cookieHeader(fake), "");
});
