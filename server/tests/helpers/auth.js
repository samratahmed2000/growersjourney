import { createAuth } from "../../auth/create-auth.js";
import { memoryAdapter } from "better-auth/adapters/memory";
import { startTestServer } from "./server.js";

/**
 * Shared helpers for authentication tests.
 *
 * These tests use Better Auth's official in-memory adapter (`memoryAdapter`),
 * so they exercise the real sign-in, session lookup, expiry, CSRF, and logout
 * code paths without opening a MongoDB connection. The adapter is injectable in
 * `createAuth()` for exactly this purpose.
 */

export const TEST_SECRET = "test-only-secret-that-is-long-enough-32";

export const TEST_PASSWORD = "correct horse battery staple";

export const TRUSTED_ORIGIN = "http://localhost:3000";

let emailCounter = 0;

/** Fresh, unique email per user so tests never collide. */
export function nextEmail(prefix = "user") {
  emailCounter += 1;
  return `${prefix}.${emailCounter}@example.com`;
}

/**
 * Build a Better Auth instance backed by an empty in-memory database.
 *
 * `quiet` and `rateLimitEnabled` default to test-friendly values; individual
 * tests opt back into rate limiting when that is what they are checking.
 */
export function createTestAuth({
  rateLimitEnabled = false,
  signInMax = 5,
  signInWindow = 60,
  useSecureCookies = false,
} = {}) {
  const db = {
    user: [],
    session: [],
    account: [],
    verification: [],
  };

  const auth = createAuth({
    adapter: memoryAdapter(db),
    secret: TEST_SECRET,
    baseURL: TRUSTED_ORIGIN,
    trustedOrigins: [TRUSTED_ORIGIN],
    useSecureCookies,
    rateLimitEnabled,
    signInMax,
    signInWindow,
    quiet: true,
  });

  return { auth, db };
}

/** Create a user through the same server-side method provisioning uses. */
export async function createTestUser(
  auth,
  {
    role = "CLIENT",
    email = nextEmail(role.toLowerCase()),
    password = TEST_PASSWORD,
    name = `${role} User`,
  } = {},
) {
  const result = await auth.api.createUser({
    body: { email, password, name, role },
  });

  return { user: result.user, email, password };
}

/** Start the real Express app with authentication mounted. */
export async function startAuthTestServer(options = {}) {
  const { auth, db } = options.auth
    ? { auth: options.auth, db: options.db ?? null }
    : createTestAuth(options.authOptions);

  const server = await startTestServer({
    allowedOrigins: [TRUSTED_ORIGIN],
    auth,
    ...(options.appOptions ?? {}),
  });

  return { ...server, auth, db };
}

function readSetCookie(response) {
  const values =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie")].filter(Boolean);

  return values;
}

/** Read the `Cookie` request header value from a response's Set-Cookie. */
export function cookieHeader(response) {
  return readSetCookie(response)
    .map((value) => value.split(";")[0])
    .join("; ");
}

/** Raw Set-Cookie strings, for asserting cookie attributes. */
export function setCookieHeaders(response) {
  return readSetCookie(response);
}

/** Sign in through Better Auth's real HTTP endpoint. */
export async function signIn(
  baseUrl,
  {
    email,
    password = TEST_PASSWORD,
    origin = TRUSTED_ORIGIN,
    headers = {},
  } = {},
) {
  const requestHeaders = { "content-type": "application/json", ...headers };
  if (origin !== null) {
    requestHeaders.origin = origin;
  }

  const response = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify({ email, password }),
  });

  const json = await response.json().catch(() => null);

  return {
    response,
    json,
    cookie: cookieHeader(response),
    setCookies: setCookieHeaders(response),
  };
}

/** GET a JSON API endpoint with an optional cookie. */
export async function getJson(baseUrl, path, { cookie, headers = {} } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      accept: "application/json",
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
  });

  const json = await response.json().catch(() => null);
  return { response, json };
}
