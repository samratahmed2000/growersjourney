import { HttpError, notFoundError } from "../utils/http-error.js";
import { ROLES, normalizeRole } from "./roles.js";

/**
 * Authorization helpers shared by every protected route.
 *
 * Two different questions are answered here on purpose:
 *
 * 1. Role authorization — "may this kind of user call this operation?"
 *    (`assertRole`)
 * 2. Object authorization — "is this particular record theirs?"
 *    (`assertResourceOwner` / `ownedByQuery`)
 *
 * Both use the trusted identity attached by `requireAuth`, never a `userId`,
 * `role`, or ownership value taken from the request body or query string.
 */

/** Field on a client-owned record that holds the owning user's id. */
export const DEFAULT_OWNER_FIELD = "clientUserId";

/**
 * Build the query fragment for records owned by a resolved Client document.
 *
 * This is the project-style ownership check: `Project.clientId` points at a
 * Client `_id`, not at a Better Auth user id. The caller must resolve the client
 * from `req.auth.user.id` first.
 */
export function clientOwnedQuery(clientId) {
  if (!clientId) {
    throw new HttpError(
      403,
      "PORTAL_ACCESS_DENIED",
      "Your account is not linked to an active client record.",
    );
  }

  return { clientId };
}

/**
 * Assert that a loaded record belongs to the resolved client.
 *
 * Cross-client access intentionally returns 404, because confirming that the
 * record exists would already leak information.
 */
export function assertClientOwned({ clientId, resource }) {
  if (!clientId || !resource || typeof resource !== "object") {
    throw notFoundError();
  }

  const ownerId = resource.clientId;

  if (!ownerId || String(ownerId) !== String(clientId)) {
    throw notFoundError();
  }

  return resource;
}

/**
 * Reduce a Better Auth user to the fields the rest of the application needs.
 * Never include the account password, session token, or provider secrets.
 *
 * @param {object} user
 */
export function toSafeUser(user) {
  return {
    id: String(user?.id ?? ""),
    email: typeof user?.email === "string" ? user.email : "",
    name: typeof user?.name === "string" ? user.name : "",
    role: normalizeRole(user?.role),
  };
}

/**
 * Throw `403 FORBIDDEN` unless the authenticated user holds one of the allowed
 * roles. A missing or unknown role also fails here, so a caller that forgets
 * `requireAuth` still cannot pass by accident: the default is deny.
 *
 * @param {{ role?: unknown } | undefined} user
 * @param {readonly string[]} allowedRoles
 * @returns {string} the normalized role
 */
export function assertRole(user, allowedRoles) {
  const role = normalizeRole(user?.role);

  if (!role) {
    throw new HttpError(
      403,
      "FORBIDDEN",
      "Your account is not authorized for this area.",
    );
  }

  if (!allowedRoles.includes(role)) {
    throw new HttpError(
      403,
      "FORBIDDEN",
      "You do not have permission to access this resource.",
    );
  }

  return role;
}

/**
 * Build the Mongo filter for a client's own records.
 *
 * Use this instead of trusting a `clientId`/`userId` from the request:
 *
 *   const invoice = await Invoice.findOne({
 *     _id: invoiceId,
 *     ...ownedByQuery(req.auth.user),
 *   });
 *
 * Staff do not get an implicit filter here. A team member's access must come
 * from an explicit project-membership grant, checked separately by the feature
 * that owns that data. Returning an unscoped `{}` for staff would be a silent
 * data leak, so this throws instead.
 *
 * @param {{ id: string, role?: unknown }} user
 * @param {string} ownerField
 */
export function ownedByQuery(user, ownerField = DEFAULT_OWNER_FIELD) {
  if (normalizeRole(user?.role) !== ROLES.CLIENT || !user?.id) {
    throw new HttpError(
      403,
      "FORBIDDEN",
      "This resource requires an explicit client or project membership.",
    );
  }

  return { [ownerField]: user.id };
}

/**
 * Assert that a client owns a record loaded from the database.
 *
 * Cross-client requests intentionally get `404 NOT_FOUND`, not `403`: telling
 * Client A that Client B's invoice exists is already an information leak.
 *
 * Staff are rejected by this helper unless the calling feature has already
 * verified an explicit membership. It is intentionally not a "staff can see
 * everything" shortcut.
 *
 * @param {object} params
 * @param {{ id: string, role?: unknown }} params.user trusted identity
 * @param {object | null | undefined} params.resource database record
 * @param {string} [params.ownerField]
 */
export function assertResourceOwner({
  user,
  resource,
  ownerField = DEFAULT_OWNER_FIELD,
}) {
  if (normalizeRole(user?.role) !== ROLES.CLIENT || !user?.id) {
    // Deliberately the same response as a missing record.
    throw notFoundError();
  }

  if (!resource || typeof resource !== "object") {
    throw notFoundError();
  }

  const ownerId = resource[ownerField];

  if (typeof ownerId !== "string" || ownerId !== user.id) {
    throw notFoundError();
  }

  return resource;
}
