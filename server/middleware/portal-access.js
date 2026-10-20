import { HttpError } from "../utils/http-error.js";

/**
 * Resolve the active Client record linked to a verified CLIENT session.
 *
 * This middleware must run after requireAuth and requireRole("CLIENT"). It
 * deliberately ignores any client id, user id, or ownership value supplied by
 * the request.
 */
export function createRequirePortalClient({ clientRepository } = {}) {
  if (typeof clientRepository?.findActiveByUserId !== "function") {
    throw new Error(
      "createRequirePortalClient() requires a clientRepository with findActiveByUserId().",
    );
  }

  return async function requirePortalClient(req, res, next) {
    try {
      const client = await clientRepository.findActiveByUserId(req.auth.user.id);

      if (!client) {
        throw new HttpError(
          403,
          "PORTAL_ACCESS_DENIED",
          "Your account is not linked to an active client record. Please contact Growers Journy.",
        );
      }

      req.portal = {
        client: {
          id: String(client._id ?? client.id),
          displayName: client.displayName,
          companyName: client.companyName ?? null,
        },
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

export default createRequirePortalClient;
