import test from "node:test";
import assert from "node:assert/strict";
import { createAuth } from "../auth/create-auth.js";
import { memoryAdapter } from "better-auth/adapters/memory";
import {
  TEST_PASSWORD,
  createTestAuth,
  createTestUser,
  signIn,
  startAuthTestServer,
} from "./helpers/auth.js";

/**
 * Configuration-level checks: password storage, cookie flags, and validation of
 * the auth factory itself. These do not open a database connection either.
 */

test("passwords are hashed and never stored in plaintext", async () => {
  const { auth, db } = createTestAuth();

  const { user, email } = await createTestUser(auth, {
    role: "CLIENT",
    password: TEST_PASSWORD,
  });

  const credential = db.account.find(
    (account) => account.providerId === "credential",
  );

  assert.ok(credential, "expected a credential account row");
  assert.notEqual(credential.password, TEST_PASSWORD);
  assert.ok(!credential.password.includes(TEST_PASSWORD));
  assert.match(
    credential.password,
    /^[0-9a-f]+:[0-9a-f]+$/i,
    "expected a salted scrypt hash",
  );

  // The user document itself must not carry a password field.
  const storedUser = db.user.find((candidate) => candidate.id === user.id);
  assert.ok(storedUser);
  assert.equal(storedUser.email, email);
  assert.ok(!("password" in storedUser));
});

test("a session cookie is fixed at seven days and uses safe attributes", async (t) => {
  const app = await startAuthTestServer();
  t.after(() => app.close());

  const { email } = await createTestUser(app.auth);
  const { setCookies } = await signIn(app.baseUrl, { email });

  const cookie = setCookies.join("\n");

  assert.match(cookie, /Max-Age=604800/);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
  assert.match(cookie, /Path=\//i);
  assert.doesNotMatch(cookie, /Domain=/i, "cookie must stay host-only");
});

test("production cookies are Secure and use the __Secure- prefix", async (t) => {
  const { auth } = createTestAuth({ useSecureCookies: true });
  const app = await startAuthTestServer({ auth });
  t.after(() => app.close());

  const { email } = await createTestUser(auth);
  const { setCookies } = await signIn(app.baseUrl, { email });

  const cookie = setCookies.join("\n");

  assert.match(cookie, /^__Secure-gj\.session_token=/);
  assert.match(cookie, /;\s*Secure/i);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
});

test("unknown roles cannot be created through the supported API", async () => {
  const { auth, db } = createTestAuth();

  await assert.rejects(
    auth.api.createUser({
      body: {
        email: "unknown-role@example.com",
        password: TEST_PASSWORD,
        name: "Unknown Role",
        role: "SUPERUSER",
      },
    }),
  );

  assert.equal(db.user.length, 0);
});

test("a user created without an explicit role gets CLIENT, never admin", async () => {
  const { auth, db } = createTestAuth();

  const result = await auth.api.createUser({
    body: {
      email: "default-role@example.com",
      password: TEST_PASSWORD,
      name: "Default Role",
    },
  });

  assert.equal(result.user.role, "CLIENT");
  assert.equal(db.user[0].role, "CLIENT");
});

test("createAuth refuses insecure or incomplete configuration", () => {
  assert.throws(
    () =>
      createAuth({
        secret: "x".repeat(48),
        baseURL: "http://localhost:3000",
      }),
    /requires a MongoDB database/,
  );

  assert.throws(
    () =>
      createAuth({
        adapter: memoryAdapter({}),
        secret: "too-short",
        baseURL: "http://localhost:3000",
      }),
    /at least 32 characters/,
  );

  assert.throws(
    () =>
      createAuth({
        adapter: memoryAdapter({}),
        secret: "x".repeat(48),
        baseURL: "not-a-url",
      }),
    /absolute http\(s\) baseURL/,
  );

  assert.throws(
    () =>
      createAuth({
        adapter: memoryAdapter({}),
        secret: "x".repeat(48),
        baseURL: "http://localhost:3000",
        signInMax: 0,
      }),
    /positive integer/,
  );
});
