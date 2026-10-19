/**
 * Minimal database connectivity check — no business models involved.
 *
 * Usage:
 *   cd server
 *   node scripts/check-db.js
 *
 * Exit code 0 = connected and the database answered a ping.
 * Exit code 1 = configuration or connection problem.
 *
 * It prints the database name and connection state only. Credentials, the
 * connection string, and driver error payloads are never printed.
 */
import {
  connectDatabase,
  disconnectDatabase,
  getDatabaseName,
  getDatabaseState,
  pingDatabase,
} from "../config/database.js";

let exitCode = 1;

try {
  await connectDatabase();

  const reachable = await pingDatabase();

  console.log(`Database name : ${getDatabaseName() ?? "(unknown)"}`);
  console.log(`Ready state   : ${getDatabaseState()}`);
  console.log(`Ping          : ${reachable ? "ok" : "failed"}`);

  if (reachable) {
    console.log("Database connectivity check passed.");
    exitCode = 0;
  } else {
    console.error(
      "Database connectivity check failed: the database did not answer a ping.",
    );
  }
} catch (error) {
  console.error(
    `Database connectivity check failed (${error?.name ?? "Error"}). ` +
      "Verify MONGODB_URI in server/.env and your MongoDB Atlas network access list. " +
      "Connection details are intentionally not logged.",
  );
}

try {
  await disconnectDatabase();
} catch {
  console.error("Could not close the database connection cleanly.");
}

process.exit(exitCode);
