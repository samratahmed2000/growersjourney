import { Router } from "express";
import { sendSuccess } from "../../utils/api-response.js";
import { portalDashboardRepository as defaultRepository } from "../../repositories/portal-dashboard-repository.js";
import {
  serializePortalActivity,
  serializePortalProjectSummary,
  serializePortalUpcomingMilestone,
} from "../../utils/serializers.js";

export function createPortalDashboardRouter({
  repository = defaultRepository,
} = {}) {
  const router = Router();

  router.get("/", async (req, res) => {
    const dashboard = await repository.getDashboard({
      clientId: req.portal.client.id,
    });

    const summary = (project) =>
      serializePortalProjectSummary(
        project,
        dashboard.milestoneCounts.get(String(project._id)),
      );

    sendSuccess(res, {
      client: req.portal.client,
      stats: dashboard.stats,
      activeProjects: dashboard.activeProjects.map(summary),
      recentlyUpdatedProjects: dashboard.recentlyUpdatedProjects.map(summary),
      upcomingMilestones: dashboard.upcomingMilestones.map(
        serializePortalUpcomingMilestone,
      ),
      recentActivity: dashboard.recentActivity.map(serializePortalActivity),
    });
  });

  return router;
}

export default createPortalDashboardRouter;
