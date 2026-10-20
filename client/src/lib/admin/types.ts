export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type DashboardSummary = {
  inquiries: { total: number; new: number; pending: number };
  projects: { total: number; active: number };
  clients: { total: number; active: number };
  recentInquiries: InquirySummary[];
};

export type InquiryStatus =
  | "NEW"
  | "REVIEWING"
  | "QUALIFIED"
  | "CONVERTED"
  | "CLOSED";

export type InquirySummary = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  service: string;
  status: InquiryStatus;
  createdAt: string | null;
  updatedAt: string | null;
};

export type InquiryDetail = InquirySummary & {
  projectDescription: string;
  budget: string | null;
  timeline: string | null;
  referenceUrl: string | null;
  statusChangedAt: string | null;
  allowedNextStatuses: InquiryStatus[];
};

export type ClientStatus = "ACTIVE" | "INACTIVE";

export type ClientSummary = {
  id: string;
  displayName: string;
  companyName: string | null;
  primaryEmail: string;
  phone: string | null;
  status: ClientStatus;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ClientDetail = ClientSummary & {
  notes: string | null;
};

export type ProjectStatus =
  | "PLANNING"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export type ProjectSummary = {
  id: string;
  name: string;
  status: ProjectStatus;
  client: {
    id: string;
    displayName?: string;
    companyName?: string | null;
    primaryEmail?: string | null;
    status?: string | null;
  } | null;
  startDate: string | null;
  dueDate: string | null;
  updatedAt: string | null;
};

export type ProjectDetail = ProjectSummary & {
  description: string | null;
  links: { label: string; url: string }[];
  completedAt: string | null;
  statusChangedAt: string | null;
  createdAt: string | null;
  allowedNextStatuses: ProjectStatus[];
  milestoneCounts: { total: number; completed: number };
};

export type MilestoneStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";

export type Milestone = {
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
  allowedNextStatuses: MilestoneStatus[];
};

export type ProjectUpdateVisibility = "INTERNAL" | "CLIENT";

export type ProjectUpdate = {
  id: string;
  projectId: string;
  title: string;
  body: string;
  visibility: ProjectUpdateVisibility;
  authorId: string;
  authorName: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PortalAccess = {
  userId: string;
  name: string | null;
  email: string | null;
  linkedAt: string | null;
  missing: boolean;
};

export type ClientDetailWithAccess = ClientDetail & {
  portalAccess: PortalAccess | null;
};

export type Service = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string | null;
  icon: string;
  audience: string | null;
  problems: string[];
  deliverables: string[];
  capabilities: string[];
  technologies: string[];
  isPublished: boolean;
  isArchived: boolean;
  sortOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PortfolioStatus = "CONCEPT" | "IN_PROGRESS" | "COMPLETED";

export type PortfolioEntry = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string | null;
  category: string | null;
  status: PortfolioStatus;
  technologies: string[];
  features: string[];
  thumbnailUrl: string | null;
  imageUrls: string[];
  liveUrl: string | null;
  sourceUrl: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt: string | null;
  isSample: boolean;
  isArchived: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ListResult<T> = {
  data: { items: T[] };
  pagination: Pagination;
};
