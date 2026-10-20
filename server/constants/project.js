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

export const PROJECT_LIMITS = Object.freeze({
  name: { min: 2, max: 160 },
  description: { max: 5000 },
});
