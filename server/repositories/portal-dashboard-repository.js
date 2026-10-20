import { projectRepository } from "./project-repository.js";
import { milestoneRepository } from "./milestone-repository.js";
import { projectUpdateRepository } from "./project-update-repository.js";

/**
 * Assemble the client dashboard from the same scoped repositories used by the
 * list/detail endpoints. No request-supplied client id is accepted.
 */
export async function getPortalDashboard({ clientId, now = new Date() }) {
  const [activeProjects, recentlyUpdatedProjects] = await Promise.all([
    projectRepository.listActiveForClient({ clientId, limit: 6 }),
    projectRepository.listRecentForClient({ clientId, limit: 5 }),
  ]);

  const projectIds = [
    ...new Map(
      [...activeProjects, ...recentlyUpdatedProjects].map((project) => [
        String(project._id),
        project._id,
      ]),
    ).values(),
  ];

  const [
    milestoneCounts,
    upcomingMilestones,
    recentActivity,
    activeProjectCount,
    upcomingMilestoneCount,
    completedMilestoneCount,
  ] = await Promise.all([
    milestoneRepository.countsForProjects(projectIds),
    milestoneRepository.listUpcomingForClient({ clientId, now, limit: 5 }),
    projectUpdateRepository.listRecentForClient({ clientId, limit: 8 }),
    projectRepository.countActiveForClient(clientId),
    milestoneRepository.countUpcomingForClient({ clientId, now }),
    milestoneRepository.countCompletedForClient(clientId),
  ]);

  return {
    activeProjects,
    recentlyUpdatedProjects,
    milestoneCounts,
    upcomingMilestones,
    recentActivity,
    stats: {
      activeProjects: activeProjectCount,
      upcomingMilestones: upcomingMilestoneCount,
      completedMilestones: completedMilestoneCount,
    },
  };
}

export const portalDashboardRepository = Object.freeze({
  getDashboard: getPortalDashboard,
});

export default portalDashboardRepository;
