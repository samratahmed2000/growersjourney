import { Router } from "express";
import { getDatabaseState, pingDatabase } from "../config/database.js";

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
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
    },
  });
});

router.get("/health/ready", async (req, res) => {
  const isReachable = await pingDatabase();

  if (!isReachable) {
    res.status(503).json({
      success: false,
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "The database is not reachable.",
        details: [{ database: getDatabaseState() }],
      },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      status: "ready",
      database: "connected",
    },
  });
});

export default router;
