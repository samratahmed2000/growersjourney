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
  completedAt: string | null;
  createdAt: string | null;
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
