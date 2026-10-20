import { Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { HttpError, notFoundError } from "../../utils/http-error.js";
import { sendPaginated, sendSuccess } from "../../utils/api-response.js";
import { validate } from "../../middleware/validate.js";
import {
  clientIdParamsSchema,
  clientListQuerySchema,
  createClientSchema,
  portalAccessSchema,
  updateClientSchema,
} from "../../validators/admin/client.js";
import { paginationMeta } from "../../validators/admin/common.js";
import { clientRepository as defaultRepository } from "../../repositories/client-repository.js";
import { projectRepository as defaultProjectRepository } from "../../repositories/project-repository.js";
import {
  serializeClientDetail,
  serializeClientSummary,
  serializePortalAccess,
  serializeProjectSummary,
} from "../../utils/serializers.js";
import { isDuplicateKeyError } from "../../utils/mongo-errors.js";
import { normalizeRole } from "../../auth/roles.js";
import { ROLES } from "../../auth/roles.js";

function duplicateEmailError() {
  return new HttpError(
    409,
    "DUPLICATE_CLIENT_EMAIL",
    "A client with this email address already exists.",
    [{ field: "body.primaryEmail", message: "This email is already in use." }],
  );
}

async function portalAccessFor({ auth, headers, client }) {
  if (!client?.userId) return null;

  try {
    const user = await auth.api.getUser({
      headers: fromNodeHeaders(headers),
      query: { id: String(client.userId) },
    });

    return {
      ...serializePortalAccess({ ...user, linkedAt: client.portalLinkedAt }),
      missing: false,
    };
  } catch {
    return {
      userId: String(client.userId),
      name: null,
      email: null,
      linkedAt: client.portalLinkedAt
        ? new Date(client.portalLinkedAt).toISOString()
        : null,
      missing: true,
    };
  }
}

export function createAdminClientsRouter({
  repository = defaultRepository,
  projectRepository = defaultProjectRepository,
  auth,
} = {}) {
  const router = Router();

  router.get("/", validate({ query: clientListQuerySchema }), async (req, res) => {
    const query = req.validated.query;
    const { items, total } = await repository.list(query);

    sendPaginated(
      res,
      { items: items.map(serializeClientSummary) },
      paginationMeta({ page: query.page, limit: query.limit, total }),
    );
  });

  router.post("/", validate({ body: createClientSchema }), async (req, res) => {
    const existing = await repository.findByEmail(req.validated.body.primaryEmail);
    if (existing) throw duplicateEmailError();

    let client;
    try {
      client = await repository.create({
        ...req.validated.body,
        updatedBy: req.auth.user.id,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) throw duplicateEmailError();
      throw error;
    }

    sendSuccess(res, { client: serializeClientDetail(client) }, 201);
  });

  router.get(
    "/:id",
    validate({ params: clientIdParamsSchema }),
    async (req, res) => {
      const { id } = req.validated.params;
      const client = await repository.findById(id);
      if (!client) throw notFoundError("Client not found.");

      const projects = await projectRepository.listByClientId(id);
      const portalAccess = await portalAccessFor({
        auth,
        headers: req.headers,
        client,
      });

      sendSuccess(res, {
        client: serializeClientDetail(client),
        projects: projects.map(serializeProjectSummary),
        portalAccess,
      });
    },
  );

  router.patch(
    "/:id",
    validate({ params: clientIdParamsSchema, body: updateClientSchema }),
    async (req, res) => {
      const { id } = req.validated.params;
      const changes = { ...req.validated.body };

      if (changes.primaryEmail) {
        const existing = await repository.findByEmail(changes.primaryEmail);
        if (existing && String(existing._id ?? existing.id) !== id) {
          throw duplicateEmailError();
        }
      }

      let client;
      try {
        client = await repository.update({
          id,
          changes: { ...changes, updatedBy: req.auth.user.id },
        });
      } catch (error) {
        if (isDuplicateKeyError(error)) throw duplicateEmailError();
        throw error;
      }

      if (!client) throw notFoundError("Client not found.");
      sendSuccess(res, { client: serializeClientDetail(client) });
    },
  );

  /**
   * Explicitly link or unlink an existing CLIENT account. No account is
   * created here, and an email match alone never grants access at login.
   */
  router.patch(
    "/:id/portal-access",
    validate({ params: clientIdParamsSchema, body: portalAccessSchema }),
    async (req, res) => {
      const { id } = req.validated.params;
      const client = await repository.findById(id);
      if (!client) throw notFoundError("Client not found.");

      const { email } = req.validated.body;

      if (email === null) {
        const updated = await repository.unlinkPortalUser({
          id,
          updatedBy: req.auth.user.id,
        });
        sendSuccess(res, { portalAccess: null, client: serializeClientDetail(updated) });
        return;
      }

      const result = await auth.api.listUsers({
        headers: fromNodeHeaders(req.headers),
        query: {
          searchValue: email,
          searchField: "email",
          searchOperator: "contains",
          limit: 10,
        },
      });

      const user = (result.users ?? []).find(
        (candidate) =>
          String(candidate.email).toLowerCase() === email.toLowerCase(),
      );

      if (!user) {
        throw new HttpError(
          404,
          "PORTAL_USER_NOT_FOUND",
          "No account exists with that email address.",
        );
      }

      if (normalizeRole(user.role) !== ROLES.CLIENT) {
        throw new HttpError(
          409,
          "PORTAL_USER_NOT_CLIENT",
          "Only a CLIENT account can be linked to a client record.",
        );
      }

      if (user.banned === true) {
        throw new HttpError(
          409,
          "PORTAL_USER_BANNED",
          "This account is suspended and cannot be linked.",
        );
      }

      const existing = await repository.findByPortalUserId(user.id);
      if (existing && String(existing._id ?? existing.id) !== id) {
        throw new HttpError(
          409,
          "PORTAL_USER_ALREADY_LINKED",
          "That account is already linked to another client record.",
        );
      }

      let updated;
      try {
        updated = await repository.linkPortalUser({
          id,
          userId: user.id,
          linkedBy: req.auth.user.id,
        });
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          throw new HttpError(
            409,
            "PORTAL_USER_ALREADY_LINKED",
            "That account is already linked to another client record.",
          );
        }
        throw error;
      }

      if (!updated) throw notFoundError("Client not found.");

      sendSuccess(res, {
        client: serializeClientDetail(updated),
        portalAccess: {
          ...serializePortalAccess({
            ...user,
            linkedAt: updated.portalLinkedAt,
          }),
          missing: false,
        },
      });
    },
  );

  return router;
}

export default createAdminClientsRouter;
