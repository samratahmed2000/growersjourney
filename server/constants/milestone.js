/** Milestone delivery states. */
export const MILESTONE_STATUSES = Object.freeze([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "BLOCKED",
]);

export const INITIAL_MILESTONE_STATUS = "PENDING";

/**
 * Valid milestone status transitions.
 *
 * A completed milestone can be reopened, which clears `completedAt`.
 */
export const MILESTONE_STATUS_TRANSITIONS = Object.freeze({
  PENDING: Object.freeze(["IN_PROGRESS", "COMPLETED", "BLOCKED"]),
  IN_PROGRESS: Object.freeze(["PENDING", "COMPLETED", "BLOCKED"]),
  BLOCKED: Object.freeze(["PENDING", "IN_PROGRESS"]),
  COMPLETED: Object.freeze(["IN_PROGRESS"]),
});

export const MILESTONE_LIMITS = Object.freeze({
  title: { min: 2, max: 160 },
  description: { max: 2000 },
  sortOrder: { min: 0, max: 9999 },
});
