import { Router } from "express";
import { sendSuccess } from "../../utils/api-response.js";
import { dashboardRepository as defaultRepository } from "../../repositories/dashboard-repository.js";

export function createDashboardRouter({ repository = defaultRepository } = {}) {
  const router = Router();

  router.get("/", async (req, res) => {
    const summary = await repository.getSummary();
    sendSuccess(res, summary);
  });

  return router;
}

export default createDashboardRouter;
