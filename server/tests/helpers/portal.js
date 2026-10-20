import {
  createFakeAdminRepositories,
  jsonRequest,
} from "./admin.js";
import {
  createTestUser,
  signIn,
  startAuthTestServer,
} from "./auth.js";

export const SECOND_CLIENT_ID = "64b000000000000000000010";
export const SECOND_PROJECT_ID = "64b000000000000000000011";
export const SECOND_MILESTONE_ID = "64b000000000000000000012";

/**
 * Start the app with the shared in-memory repositories mounted for both admin
 * and portal tests.
 */
export async function startPortalTestServer() {
  const { repositories, data } = createFakeAdminRepositories();
  const server = await startAuthTestServer({
    appOptions: {
      adminRepositories: repositories,
      portalRepositories: repositories,
    },
  });

  // Spread the server so tests can use `baseUrl`/`close`, while keeping the
  // Better Auth instance and in-memory data close at hand.
  return {
    ...server,
    app: server,
    auth: server.auth,
    repositories,
    data,
  };
}

/** Create a CLIENT login and explicitly link it to a fake client record. */
export async function linkClientUser({
  app,
  auth,
  data,
  client = data.clients[0],
  role = "CLIENT",
  status = "ACTIVE",
} = {}) {
  const { user, email } = await createTestUser(auth, { role });
  client.status = status;
  client.userId = user.id;
  client.portalLinkedAt = new Date();
  const { cookie } = await signIn(app.baseUrl, { email });
  return { user, email, cookie, client };
}

/** Add another client and project so ownership/cross-client tests are real. */
export function addSecondClient(data) {
  const client = {
    _id: SECOND_CLIENT_ID,
    displayName: "Second Client",
    companyName: "Other Co",
    primaryEmail: "second@example.com",
    phone: null,
    status: "ACTIVE",
    notes: "Internal note",
    createdAt: new Date("2026-10-01T10:00:00Z"),
    updatedAt: new Date("2026-10-01T10:00:00Z"),
  };
  const project = {
    _id: SECOND_PROJECT_ID,
    name: "Second Project",
    description: "A private project for the second client.",
    clientId: client,
    status: "IN_PROGRESS",
    startDate: new Date("2026-10-01T00:00:00Z"),
    dueDate: new Date("2026-12-01T00:00:00Z"),
    links: [],
    createdAt: new Date("2026-10-01T10:00:00Z"),
    updatedAt: new Date("2026-10-02T10:00:00Z"),
  };
  const milestone = {
    _id: SECOND_MILESTONE_ID,
    projectId: SECOND_PROJECT_ID,
    title: "Second private milestone",
    description: "Must not leak to the first client.",
    status: "PENDING",
    dueDate: new Date("2026-11-01T00:00:00Z"),
    sortOrder: 0,
    createdAt: new Date("2026-10-01T10:00:00Z"),
    updatedAt: new Date("2026-10-01T10:00:00Z"),
  };

  data.clients.push(client);
  data.projects.push(project);
  data.milestones.push(milestone);
  return { client, project, milestone };
}

export { jsonRequest };
