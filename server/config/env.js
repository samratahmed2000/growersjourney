import "dotenv/config";

/**
 * Central, validated environment configuration — BACKEND ONLY.
 *
 * Why this file exists:
 * - Environment loading happens in exactly one place, so the rest of the server
 *   never reads `process.env` directly.
 * - Required variables are validated during startup, so the process fails
 *   immediately and clearly instead of crashing later inside a request.
 * - Secret values are NEVER logged. Error messages name the variable only.
 *
 * Rules kept here on purpose:
 * - Nothing in this file is ever imported by frontend code.
 * - No value from this file may be exposed through a NEXT_PUBLIC_* variable.
 */

const DEFAULT_PORT = 5000;
const DEFAULT_FRONTEND_URL = "http://localhost:3000";

const problems = [];

/** Print safe, actionable messages and stop the process. */
function fail(messages) {
  console.error("\n[config] Startup configuration problem(s):");
  for (const message of messages) {
    console.error(`  - ${message}`);
  }
  console.error(
    "\nFix server/.env (copy server/.env.example if needed), then start the server again.\n",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// MONGODB_URI — required. Validated for shape only; the value is never printed.
// ---------------------------------------------------------------------------
const mongodbUri = (process.env.MONGODB_URI ?? "").trim();
let databaseName = "";

if (!mongodbUri) {
  problems.push(
    "MONGODB_URI is missing. Set it to your MongoDB Atlas connection string.",
  );
} else if (!/^mongodb(\+srv)?:\/\//.test(mongodbUri)) {
  problems.push('MONGODB_URI must start with "mongodb://" or "mongodb+srv://".');
} else {
  try {
    // URL parsing is only used to confirm the string is well formed and that a
    // database name is present. The parsed parts are never logged.
    const withoutQuery = mongodbUri.split("?")[0];
    const pathStart = withoutQuery.indexOf("/", withoutQuery.indexOf("//") + 2);
    databaseName = pathStart === -1 ? "" : withoutQuery.slice(pathStart + 1);

    if (!databaseName) {
      problems.push(
        'MONGODB_URI must include a database name, for example ".../growers_journy?retryWrites=true".',
      );
    } else if (/%[0-9a-fA-F]{2}/.test(databaseName) || /\s/.test(databaseName)) {
      problems.push(
        "MONGODB_URI does not contain a valid database name. URL-encode special characters in the username and password.",
      );
      databaseName = "";
    }
  } catch {
    problems.push("MONGODB_URI could not be parsed as a valid connection string.");
  }
}

// ---------------------------------------------------------------------------
// PORT — optional, must be a valid port number when provided.
// ---------------------------------------------------------------------------
const rawPort = (process.env.PORT ?? "").trim();
let port = DEFAULT_PORT;

if (rawPort) {
  const parsedPort = Number.parseInt(rawPort, 10);
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    problems.push("PORT must be a whole number between 1 and 65535.");
  } else {
    port = parsedPort;
  }
}

// ---------------------------------------------------------------------------
// FRONTEND_URL — optional, used as the CORS allowlist.
// ---------------------------------------------------------------------------
const frontendUrls = (process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (frontendUrls.length === 0) {
  problems.push("FRONTEND_URL must contain at least one frontend origin.");
}

// ---------------------------------------------------------------------------
// TRUST_PROXY — optional. `false` by default.
//
// Express needs to know how many reverse-proxy hops sit in front of it before
// it can read the real client IP from X-Forwarded-For. That IP is what the
// public rate limiter counts, so getting this wrong matters:
//   - `false` (default): the socket address is used. Correct when the API is
//     reached directly, or in local development.
//   - a number 1-10: trust that many hops. Correct behind one known proxy or
//     load balancer (for example a single platform edge).
// A permissive `true` is deliberately NOT accepted: it would trust a header any
// caller can forge, letting a bot reset its own rate-limit bucket at will.
// ---------------------------------------------------------------------------
const rawTrustProxy = (process.env.TRUST_PROXY ?? "").trim();
let trustProxy = false;

if (rawTrustProxy && rawTrustProxy.toLowerCase() !== "false") {
  if (!/^\d+$/.test(rawTrustProxy)) {
    problems.push(
      "TRUST_PROXY must be false or a hop count between 1 and 10 (for example TRUST_PROXY=1).",
    );
  } else {
    const hops = Number.parseInt(rawTrustProxy, 10);
    if (hops > 10) {
      problems.push("TRUST_PROXY must be false or a hop count between 1 and 10.");
    } else if (hops > 0) {
      trustProxy = hops;
    }
  }
}

const nodeEnv = process.env.NODE_ENV || "development";

if (problems.length > 0) {
  fail(problems);
}

/** Frozen, validated configuration. Import this instead of reading process.env. */
export const env = Object.freeze({
  nodeEnv,
  isProduction: nodeEnv === "production",
  port,
  frontendUrls,
  trustProxy,
  mongodbUri,
  databaseName,
});
