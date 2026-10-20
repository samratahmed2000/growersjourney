/**
 * Application roles shared by server and browser code.
 *
 * These strings must match `server/auth/roles.js`. They are never trusted from
 * the browser: the server resolves the role from the verified session, and the
 * UI only uses it to decide which links and messages to show.
 */
export const ROLES = {
  ADMIN: "ADMIN",
  TEAM_MEMBER: "TEAM_MEMBER",
  CLIENT: "CLIENT",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export const STAFF_ROLES: readonly AppRole[] = [
  ROLES.ADMIN,
  ROLES.TEAM_MEMBER,
];

export type AuthArea = "admin" | "portal";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
};

/** Validate a value that came from the API before using it for navigation. */
export function isAppRole(value: unknown): value is AppRole {
  return (
    value === ROLES.ADMIN ||
    value === ROLES.TEAM_MEMBER ||
    value === ROLES.CLIENT
  );
}

export function isStaffRole(value: unknown): value is AppRole {
  return value === ROLES.ADMIN || value === ROLES.TEAM_MEMBER;
}

/** Task 07: the admin dashboard and its API are ADMIN-only. */
export function isAdminRole(value: unknown): value is AppRole {
  return value === ROLES.ADMIN;
}

export function isClientRole(value: unknown): value is AppRole {
  return value === ROLES.CLIENT;
}

export function areaForRole(role: AppRole): AuthArea {
  return role === ROLES.CLIENT ? "portal" : "admin";
}

export function areaPath(area: AuthArea): "/admin" | "/portal" {
  return area === "portal" ? "/portal" : "/admin";
}

const AREA_LABELS: Record<AuthArea, string> = {
  admin: "Growers Journy admin",
  portal: "Client portal",
};

export function areaLabel(area: AuthArea): string {
  return AREA_LABELS[area];
}

const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: "Administrator",
  TEAM_MEMBER: "Team member",
  CLIENT: "Client",
};

export function roleLabel(role: AppRole): string {
  return ROLE_LABELS[role];
}

/**
 * Turn a `?next=` value into a path that is safe and appropriate for the role.
 *
 * Security notes:
 * - Only a same-origin absolute path is accepted (`/...`, never `//evil.com`).
 * - Only the role's own area is accepted. A CLIENT who was sent to `/admin`
 *   lands on `/portal` instead.
 * - Anything else falls back to the role's home area. This is an open-redirect
 *   guard, not an authorization check — the server still enforces access.
 */
export function safeNextPath(role: AppRole, next: string | null): string {
  const fallback = areaPath(areaForRole(role));

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  if (next.includes("\\")) {
    return fallback;
  }

  const allowedArea = areaForRole(role);

  // Match the area itself or a child route, but not a lookalike such as
  // /administrator or /portal-evil.
  if (
    next === `/${allowedArea}` ||
    next.startsWith(`/${allowedArea}/`) ||
    next.startsWith(`/${allowedArea}?`)
  ) {
    return next;
  }

  return fallback;
}
