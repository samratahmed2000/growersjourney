import type { ProjectStatus } from "../admin/types";

export type MilestoneStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";

export type MilestoneCounts = {
  total: number;
  completed: number;
};

export type PortalProjectSummary = {
  id: string;
  name: string;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
  updatedAt: string | null;
  milestoneCounts: MilestoneCounts;
};

export type ProjectLink = {
  label: string;
  url: string;
};

export type PortalProjectDetail = PortalProjectSummary & {
  description: string | null;
  completedAt: string | null;
  createdAt: string | null;
  links: ProjectLink[];
};

export type PortalMilestone = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  dueDate: string | null;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PortalProjectUpdate = {
  id: string;
  projectId: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PortalActivity = {
  id: string;
  projectId: string;
  projectName: string | null;
  title: string;
  body: string;
  authorName: string;
  createdAt: string | null;
};

export type PortalUpcomingMilestone = {
  id: string;
  projectId: string;
  projectName: string | null;
  title: string;
  status: MilestoneStatus;
  dueDate: string | null;
};

export type PortalDashboard = {
  client: {
    id: string;
    displayName: string;
    companyName: string | null;
  };
  stats: {
    activeProjects: number;
    upcomingMilestones: number;
    completedMilestones: number;
  };
  activeProjects: PortalProjectSummary[];
  recentlyUpdatedProjects: PortalProjectSummary[];
  upcomingMilestones: PortalUpcomingMilestone[];
  recentActivity: PortalActivity[];
};
