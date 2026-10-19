import { Router } from "express";
import { getDatabaseState, pingDatabase } from "../config/database.js";
import { sendError, sendSuccess } from "../utils/api-response.js";

/**
 * Health routers.
 *
 * Two separate checks on purpose:
 * - `/health`      = liveness. "Is the web server responding?" It deliberately
 *                    does NOT touch MongoDB, so it keeps working during a
 *                    database outage. Its response shape is unchanged from
 *                    Task 01 and is consumed by the frontend dev page.
 * - `/health/ready` = readiness. "Is the database reachable?" Returns 503 when
 *                    it is not, without exposing connection details.
 *
 * Neither endpoint exposes credentials, connection strings, hostnames, driver
 * versions, or stack traces. See docs/API.md section 7.1.
 */
const router = Router();

router.get("/health", (req, res) => {
  sendSuccess(res, { status: "ok" });
});

router.get("/health/ready", async (req, res) => {
  const isReachable = await pingDatabase();

  if (!isReachable) {
    sendError(res, {
      status: 503,
      code: "DATABASE_UNAVAILABLE",
      message: "The database is not reachable.",
      details: [{ database: getDatabaseState() }],
    });
    return;
  }

  sendSuccess(res, { status: "ready", database: "connected" });
});

export default router;
