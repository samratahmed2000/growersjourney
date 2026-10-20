/**
 * Application roles.
 *
 * These are the only roles the Growers Journy application understands. They are
 * deliberately stored in Better Auth's admin-plugin `user.role` field as plain
 * uppercase strings, matching docs/Authentication-Security.md.
 *
 * Security rules encoded here:
 * - Unknown or missing roles resolve to `null`, which callers must treat as
 *   "deny". A role we do not recognise never becomes a default role.
 * - Only these exact values pass. Lowercase, comma-separated multi-role
 *   strings, and arbitrary values supplied by a browser are not accepted.
 * - `TEAM_MEMBER` is not an administrator. The two are kept separate so a bug
 *   cannot silently widen team access to admin-only operations.
 */
export const ROLES = Object.freeze({
  ADMIN: "ADMIN",
  TEAM_MEMBER: "TEAM_MEMBER",
  CLIENT: "CLIENT",
});

/** Roles allowed into the internal admin area. */
export const STAFF_ROLES = Object.freeze([ROLES.ADMIN, ROLES.TEAM_MEMBER]);

/** Every role the application can assign. */
export const ALL_ROLES = Object.freeze(Object.values(ROLES));

const ROLE_SET = new Set(ALL_ROLES);

/**
 * Return a known role, or `null`.
 *
 * Do not "fix" an unknown value by lower-casing or guessing. An unrecognised
 * role must be rejected so a typo or a tampered database value fails closed.
 *
 * @param {unknown} value
 * @returns {"ADMIN" | "TEAM_MEMBER" | "CLIENT" | null}
 */
export function normalizeRole(value) {
  if (typeof value !== "string") {
    return null;
  }

  const candidate = value.trim();
  return ROLE_SET.has(candidate) ? candidate : null;
}

/** True only for ADMIN and TEAM_MEMBER. */
export function isStaffRole(value) {
  const role = normalizeRole(value);
  return role !== null && STAFF_ROLES.includes(role);
}

/** True only for CLIENT. */
export function isClientRole(value) {
  return normalizeRole(value) === ROLES.CLIENT;
}
