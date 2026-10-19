/**
 * Shared content types for the public website.
 *
 * These describe the *shape* of the content modules in `src/lib/content/`.
 * When the public content moves to the API, the same shapes can be produced by
 * a fetch function instead of a local module, without touching the components.
 */

/** Icon keys are mapped to Lucide components in one place, not in content. */
export type IconName =
  | "code"
  | "workflow"
  | "sparkles"
  | "search"
  | "planning"
  | "design"
  | "build"
  | "quality"
  | "launch"
  | "target"
  | "layers"
  | "communication"
  | "responsive"
  | "maintenance"
  | "automation";

export type Service = {
  /** Stable anchor id, also used as the card link target. */
  slug: string;
  title: string;
  summary: string;
  icon: IconName;
  /** Who the service is for. */
  audience: string;
  /** Concrete problems the service addresses. */
  problems: string[];
  /** What the client receives. */
  deliverables: string[];
  /** Short capability list shown on cards and detail blocks. */
  capabilities: string[];
  /** Tools genuinely used in this project's stack. */
  technologies: string[];
};

/** Honest status of portfolio work. Never label a concept as delivered work. */
export type ProjectStatus = "concept" | "in-progress" | "completed";

export type Project = {
  slug: string;
  title: string;
  /** One-sentence summary used on cards and in metadata. */
  summary: string;
  category: string;
  technologies: string[];
  status: ProjectStatus;
  /**
   * `true` for illustrative content. Components render a visible "Concept"
   * label when this is set, so sample work can never be mistaken for a
   * delivered client project.
   */
  isSample: boolean;
  featured: boolean;
  context: string;
  problem: string;
  solution: string;
  features: string[];
  challenges: string[];
  learnings: string[];
  /** Only set when a real, verifiable URL exists. */
  liveUrl?: string;
  sourceUrl?: string;
};

export type ProcessStep = {
  /** Display number, e.g. "01". */
  number: string;
  title: string;
  icon: IconName;
  summary: string;
  details: string;
  deliverables: string[];
};

export type NavItem = {
  label: string;
  href: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type Differentiator = {
  title: string;
  description: string;
  icon: IconName;
};

export type LegalSection = {
  id: string;
  heading: string;
  /** Paragraphs are rendered in order above any bullet list. */
  paragraphs: string[];
  bullets?: string[];
};
