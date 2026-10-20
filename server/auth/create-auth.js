import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";
import { ROLES } from "./roles.js";

/**
 * Builds the Better Auth instance.
 *
 * Why this is a factory (and why it imports no configuration):
 * - `config/env.js` exits the process when configuration is missing. Keeping
 *   that side effect out of this module lets the Express app and the tests call
 *   `createAuth()` with explicit values.
 * - `server/index.js` owns the real MongoDB `Db`/`MongoClient` and passes them
 *   in. Nothing here reads `process.env`.
 *
 * Verified against better-auth@1.7.11 and @better-auth/mongo-adapter@1.7.11:
 * - The MongoDB adapter is the official driver-based adapter, NOT a Mongoose
 *   adapter. It receives the `Db` from the shared Mongoose connection, so the
 *   application still uses one connection pool.
 * - `auth.api.getSession({ headers })` is the supported server-side session
 *   validation method used by Express. It reads the session from MongoDB and
 *   rejects expired or revoked rows.
 * - Passwords are hashed by Better Auth with scrypt. There is no custom
 *   password field, no plaintext storage, and no hand-written password flow.
 * - Public email/password sign-up is disabled. Accounts are created by the
 *   server-side provisioning script (`scripts/create-admin.js`).
 */

/** Better Auth requires a secret of at least 32 characters. */
const MIN_SECRET_LENGTH = 32;

/** Fixed 7-day absolute session. */
const SESSION_SECONDS = 60 * 60 * 24 * 7;

/** Distinct prefix so the cookie is easy to identify and never collides. */
const COOKIE_PREFIX = "gj";

/** Custom roles exposed to Better Auth's admin plugin. */
const access = createAccessControl(defaultStatements);

const noAdminPermissions = { user: [], session: [] };

/**
 * Only ADMIN receives the admin plugin's user-management permissions. Better
 * Auth validates these role names when `createUser`/`setRole` is called, so an
 * unknown role can never be persisted by the supported API.
 */
export const AUTH_ROLES = Object.freeze({
  [ROLES.ADMIN]: access.newRole({
    user: [...defaultStatements.user],
    session: [...defaultStatements.session],
  }),
  [ROLES.TEAM_MEMBER]: access.newRole(noAdminPermissions),
  [ROLES.CLIENT]: access.newRole(noAdminPermissions),
});

/**
 * @param {object} options
 * @param {import("mongodb").Db} [options.db] MongoDB database (production).
 * @param {import("mongodb").MongoClient} [options.client] Shared driver client.
 * @param {Function} [options.adapter] Tests only: for example `memoryAdapter(db)`.
 * @param {boolean} [options.transaction=true] Adapter transactions. Atlas
 *   supports them; a standalone local MongoDB needs `false`.
 * @param {string} options.secret Better Auth signing secret.
 * @param {string} options.baseURL Public frontend origin, e.g.
 *   `https://growersjourny.com` (development: `http://localhost:3000`).
 * @param {string[]} [options.trustedOrigins] Origins allowed to call auth
 *   endpoints. Should match the backend CORS allowlist.
 * @param {boolean} [options.useSecureCookies=false] Set `Secure` on cookies.
 *   Derive this from an HTTPS base URL in production.
 * @param {boolean} [options.rateLimitEnabled=true] Better Auth rate limiting.
 * @param {number} [options.signInMax=5] Failed sign-ins per IP per window.
 * @param {number} [options.signInWindow=60] Sign-in window in seconds.
 * @param {boolean} [options.quiet=false] Silence library logs (tests).
 */
export function createAuth({
  db,
  client,
  adapter,
  transaction = true,
  secret,
  baseURL,
  trustedOrigins = [],
  useSecureCookies = false,
  rateLimitEnabled = true,
  signInMax = 5,
  signInWindow = 60,
  quiet = false,
} = {}) {
  if (!adapter && !db) {
    throw new Error(
      "createAuth() requires a MongoDB database (or an adapter in tests).",
    );
  }

  if (typeof secret !== "string" || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `createAuth() requires a secret of at least ${MIN_SECRET_LENGTH} characters.`,
    );
  }

  if (typeof baseURL !== "string" || !/^https?:\/\//i.test(baseURL)) {
    throw new Error("createAuth() requires an absolute http(s) baseURL.");
  }

  if (!Number.isInteger(signInMax) || signInMax < 1) {
    throw new Error("createAuth() signInMax must be a positive integer.");
  }

  if (!Number.isInteger(signInWindow) || signInWindow < 1) {
    throw new Error("createAuth() signInWindow must be a positive integer.");
  }

  const database = adapter ?? mongodbAdapter(db, { client, transaction });

  return betterAuth({
    appName: "Growers Journy",
    baseURL,
    secret,
    database,
    trustedOrigins,

    /**
     * Accounts are provisioned by an administrator. There is no public
     * registration endpoint, so nobody can choose their own role.
     */
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },

    /**
     * An absolute 7-day session is used deliberately. Server components cannot
     * refresh the browser's cookie, so a rolling session would silently drift
     * between the cookie and the database. No cookie cache means logout and
     * revocation take effect immediately.
     */
    session: {
      expiresIn: SESSION_SECONDS,
      disableSessionRefresh: true,
      cookieCache: { enabled: false },
    },

    /**
     * A wrong password gets the same generic error as an unknown email: the
     * library does not reveal which one was wrong.
     */
    rateLimit: {
      enabled: rateLimitEnabled,
      window: 60,
      max: 20,
      customRules: {
        "/sign-in/email": { window: signInWindow, max: signInMax },
      },
    },

    advanced: {
      useSecureCookies,
      cookiePrefix: COOKIE_PREFIX,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: useSecureCookies,
        path: "/",
      },
      // CSRF protection (Origin + Fetch Metadata checks) stays enabled. There
      // is intentionally no disableCSRFCheck here.
    },

    plugins: [
      admin({
        defaultRole: ROLES.CLIENT,
        adminRoles: [ROLES.ADMIN],
        roles: AUTH_ROLES,
      }),
    ],

    // The library's own warnings are useful in production and contain no
    // credentials or tokens. Tests silence them to keep output readable.
    logger: quiet ? { disabled: true } : { level: "warn" },

    telemetry: { enabled: false },
  });
}
