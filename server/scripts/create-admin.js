import { env } from "../config/env.js";
import {
  connectDatabase,
  disconnectDatabase,
  getMongoClient,
  getMongoDatabase,
} from "../config/database.js";
import { createAuth } from "../auth/create-auth.js";
import { ROLES } from "../auth/roles.js";

/**
 * Safe initial-administrator provisioning.
 *
 * Why a script instead of a public endpoint:
 * - There is no self-registration, so nobody can choose a role.
 * - The script needs the server-only MongoDB URI and BETTER_AUTH_SECRET. It
 *   cannot be reached from the browser and is never mounted as a route.
 * - The role is hard-coded to ADMIN here. It is not read from user input, so a
 *   typo or a crafted request cannot create a privileged account through the
 *   application.
 *
 * Credentials come from environment variables so they never appear in shell
 * history or process arguments. Use a password manager to generate a long,
 * unique password.
 *
 * Run once, from `server/`:
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_NAME="Your Name" \
 *   ADMIN_PASSWORD="a long unique password" npm run create-admin
 *
 * On Windows PowerShell:
 *
 *   $env:ADMIN_EMAIL="you@example.com"
 *   $env:ADMIN_NAME="Your Name"
 *   $env:ADMIN_PASSWORD="a long unique password"
 *   npm run create-admin
 *
 * The password is never printed. Remove the variables from the shell after use.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 12;

function fail(message) {
  console.error(`[create-admin] ${message}`);
  process.exitCode = 1;
}

const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const name = (process.env.ADMIN_NAME ?? "").trim();
// Do not trim the password: leading/trailing spaces are valid characters.
const password = process.env.ADMIN_PASSWORD ?? "";

const problems = [];

if (!email) {
  problems.push("ADMIN_EMAIL is required.");
} else if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
  problems.push("ADMIN_EMAIL must be a valid email address.");
}

if (!name) {
  problems.push("ADMIN_NAME is required.");
} else if (name.length > 100) {
  problems.push("ADMIN_NAME must be 100 characters or fewer.");
}

if (!password) {
  problems.push("ADMIN_PASSWORD is required.");
} else if (password.length < MIN_PASSWORD_LENGTH) {
  problems.push(
    `ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
  );
} else if (password.length > 128) {
  problems.push("ADMIN_PASSWORD must be 128 characters or fewer.");
}

if (problems.length > 0) {
  console.error("[create-admin] Cannot continue:");
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  console.error(
    "\nSet ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD for this command only, then try again.",
  );
  process.exit(1);
}

let connected = false;

try {
  await connectDatabase(env.mongodbUri);
  connected = true;

  const db = getMongoDatabase();
  if (!db) {
    throw new Error("MongoDB connection is not ready");
  }

  // Refuse to add a second administrator by accident. Adding another one is a
  // deliberate operation and requires the explicit override below.
  const existingAdmin = await db.collection("user").findOne({ role: ROLES.ADMIN });

  if (existingAdmin && process.env.ALLOW_ADDITIONAL_ADMIN !== "true") {
    console.error(
      "[create-admin] An ADMIN account already exists. " +
        "Set ALLOW_ADDITIONAL_ADMIN=true only if you intentionally want another administrator.",
    );
    process.exitCode = 1;
  } else {
    const auth = createAuth({
      db,
      client: getMongoClient(),
      transaction: env.mongodbTransactions,
      secret: env.betterAuthSecret,
      baseURL: env.betterAuthUrl,
      trustedOrigins: env.frontendUrls,
      useSecureCookies: env.betterAuthUrl.startsWith("https://"),
    });

    // `auth.api.createUser` is the documented server-side provisioning method.
    // Better Auth hashes the password with scrypt before it reaches MongoDB.
    const result = await auth.api.createUser({
      body: {
        email,
        name,
        password,
        role: ROLES.ADMIN,
      },
    });

    console.log(
      `[create-admin] Created ADMIN account ${result.user.email} (${result.user.id}).`,
    );
    console.log(
      "[create-admin] Sign in at /login, then remove ADMIN_PASSWORD from this shell.",
    );
  }
} catch (error) {
  // Never print the password, the connection string, or a raw driver payload.
  // The code is enough to distinguish a duplicate email from a configuration
  // or database problem.
  const code = error?.body?.code ?? error?.name ?? "Error";
  console.error(
    `[create-admin] Could not create the administrator (${code}). ` +
      "Check that the email is not already in use and that MONGODB_TRANSACTIONS is correct for this database.",
  );
  process.exitCode = 1;
} finally {
  if (connected) {
    try {
      await disconnectDatabase();
    } catch {
      console.error("[create-admin] Could not close the database connection cleanly.");
    }
  }
}
