import type {
  ClientStatus,
  InquiryStatus,
  MilestoneStatus,
  PortfolioStatus,
  ProjectStatus,
} from "./types";

export type StatusTone =
  | "neutral"
  | "info"
  | "accent"
  | "brand"
  | "warning"
  | "danger";

const INQUIRY_TONES: Record<InquiryStatus, StatusTone> = {
  NEW: "info",
  REVIEWING: "warning",
  QUALIFIED: "accent",
  CONVERTED: "brand",
  CLOSED: "neutral",
};

const CLIENT_TONES: Record<ClientStatus, StatusTone> = {
  ACTIVE: "accent",
  INACTIVE: "neutral",
};

const PROJECT_TONES: Record<ProjectStatus, StatusTone> = {
  PLANNING: "info",
  IN_PROGRESS: "accent",
  ON_HOLD: "warning",
  COMPLETED: "brand",
  CANCELLED: "danger",
};

const PORTFOLIO_TONES: Record<PortfolioStatus, StatusTone> = {
  CONCEPT: "info",
  IN_PROGRESS: "warning",
  COMPLETED: "accent",
};

const MILESTONE_TONES: Record<MilestoneStatus, StatusTone> = {
  PENDING: "neutral",
  IN_PROGRESS: "info",
  COMPLETED: "accent",
  BLOCKED: "danger",
};

export function inquiryTone(status: InquiryStatus): StatusTone {
  return INQUIRY_TONES[status];
}
export function clientTone(status: ClientStatus): StatusTone {
  return CLIENT_TONES[status];
}
export function projectTone(status: ProjectStatus): StatusTone {
  return PROJECT_TONES[status];
}
export function portfolioTone(status: PortfolioStatus): StatusTone {
  return PORTFOLIO_TONES[status];
}
export function milestoneTone(status: MilestoneStatus): StatusTone {
  return MILESTONE_TONES[status];
}
