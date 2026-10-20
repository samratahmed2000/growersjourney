/** Project pipeline states. */
export const PROJECT_STATUSES = Object.freeze([
  "PLANNING",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
]);

/** The states counted as "active" on the dashboard. */
export const ACTIVE_PROJECT_STATUSES = Object.freeze([
  "PLANNING",
  "IN_PROGRESS",
]);

export const INITIAL_PROJECT_STATUS = "PLANNING";

/**
 * Valid project status transitions.
 *
 * CANCELLED is terminal. COMPLETED can be reopened for correction, which
 * clears the completion timestamp. Nothing here auto-completes milestones.
 */
export const PROJECT_STATUS_TRANSITIONS = Object.freeze({
  PLANNING: Object.freeze(["IN_PROGRESS", "ON_HOLD", "CANCELLED"]),
  IN_PROGRESS: Object.freeze(["ON_HOLD", "COMPLETED", "CANCELLED"]),
  ON_HOLD: Object.freeze(["IN_PROGRESS", "CANCELLED"]),
  COMPLETED: Object.freeze(["IN_PROGRESS"]),
  CANCELLED: Object.freeze([]),
});

export const PROJECT_LIMITS = Object.freeze({
  name: { min: 2, max: 160 },
  description: { max: 5000 },
  links: { max: 10, labelMin: 2, labelMax: 80, urlMax: 2048 },
});
