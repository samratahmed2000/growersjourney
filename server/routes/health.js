import { Router } from "express";

/**
 * Health-check router.
 *
 * Mounted at `/api/v1` in `server/index.js`, so the public endpoint is
 * `GET /api/v1/health`.
 *
 * Why it looks like this:
 * - It returns the standard JSON envelope documented in `docs/API.md` (section 7.1).
 * - It deliberately does NOT touch MongoDB. A health check should confirm that
 *   the web server is responding, not that a database is up, and it should keep
 *   working even if the database is temporarily unavailable.
 * - It exposes no credentials, connection details, versions, or internals.
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

export default router;
