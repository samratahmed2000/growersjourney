import {
  createTestUser,
  signIn,
  startAuthTestServer,
  TRUSTED_ORIGIN,
} from "./auth.js";
import {
  ACTIVE_PROJECT_STATUSES,
  PROJECT_STATUS_TRANSITIONS,
} from "../../constants/project.js";

export { TRUSTED_ORIGIN };

export const IDS = {
  inquiry: "64b000000000000000000001",
  client: "64b000000000000000000002",
  project: "64b000000000000000000003",
  service: "64b000000000000000000004",
  portfolio: "64b000000000000000000005",
  milestone: "64b000000000000000000006",
  milestoneCompleted: "64b000000000000000000007",
  update: "64b000000000000000000008",
  internalUpdate: "64b000000000000000000009",
};

/** A complete in-memory set of admin repositories for DB-free HTTP tests. */
export function createFakeAdminRepositories() {
  let nextGeneratedId = 100;
  const generatedId = () =>
    `64b000000000000000000${String(nextGeneratedId++).padStart(3, "0")}`;

  const inquiries = [
    {
      _id: IDS.inquiry,
      name: "Test Person",
      email: "person@example.com",
      company: "Example Co",
      service: "web-application-development",
      projectDescription: "A portal for field staff to record visits.",
      status: "NEW",
      createdAt: new Date("2026-10-01T10:00:00Z"),
      updatedAt: new Date("2026-10-01T10:00:00Z"),
    },
  ];

  const clients = [
    {
      _id: IDS.client,
      displayName: "Test Client",
      companyName: "Client Co",
      primaryEmail: "client@example.com",
      phone: "+1 555 0100",
      status: "ACTIVE",
      notes: "Internal note",
      createdAt: new Date("2026-10-01T10:00:00Z"),
      updatedAt: new Date("2026-10-01T10:00:00Z"),
    },
  ];

  const projects = [
    {
      _id: IDS.project,
      name: "Test Project",
      description: "A project",
      clientId: clients[0],
      status: "IN_PROGRESS",
      startDate: new Date("2026-10-01T00:00:00Z"),
      dueDate: new Date("2026-11-01T00:00:00Z"),
      links: [],
      createdAt: new Date("2026-10-01T10:00:00Z"),
      updatedAt: new Date("2026-10-02T10:00:00Z"),
    },
  ];

  const milestones = [
    {
      _id: IDS.milestone,
      projectId: IDS.project,
      title: "Discovery",
      description: "Discovery workshop",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-10-25T00:00:00Z"),
      sortOrder: 0,
      createdAt: new Date("2026-10-01T10:00:00Z"),
      updatedAt: new Date("2026-10-02T10:00:00Z"),
    },
    {
      _id: IDS.milestoneCompleted,
      projectId: IDS.project,
      title: "Kickoff",
      description: null,
      status: "COMPLETED",
      dueDate: new Date("2026-10-05T00:00:00Z"),
      completedAt: new Date("2026-10-04T10:00:00Z"),
      sortOrder: 1,
      createdAt: new Date("2026-10-01T10:00:00Z"),
      updatedAt: new Date("2026-10-04T10:00:00Z"),
    },
  ];

  const updates = [
    {
      _id: IDS.update,
      projectId: IDS.project,
      title: "Discovery started",
      body: "We have started the discovery workshop.",
      visibility: "CLIENT",
      authorId: "admin-test",
      authorName: "Admin User",
      createdAt: new Date("2026-10-03T10:00:00Z"),
      updatedAt: new Date("2026-10-03T10:00:00Z"),
    },
    {
      _id: IDS.internalUpdate,
      projectId: IDS.project,
      title: "Internal note",
      body: "This must not reach the portal.",
      visibility: "INTERNAL",
      authorId: "admin-test",
      authorName: "Admin User",
      createdAt: new Date("2026-10-04T10:00:00Z"),
      updatedAt: new Date("2026-10-04T10:00:00Z"),
    },
  ];

  const services = [
    {
      _id: IDS.service,
      title: "Web Application Development",
      slug: "web-application-development",
      summary: "Custom web applications for growing teams.",
      description: null,
      icon: "code",
      audience: null,
      problems: [],
      deliverables: [],
      capabilities: [],
      technologies: [],
      isPublished: true,
      isArchived: false,
      sortOrder: 0,
      createdAt: new Date("2026-10-01T10:00:00Z"),
      updatedAt: new Date("2026-10-01T10:00:00Z"),
    },
  ];

  const portfolio = [
    {
      _id: IDS.portfolio,
      title: "Operations Dashboard Concept",
      slug: "operations-dashboard-concept",
      summary: "A concept for an operations dashboard.",
      description: null,
      category: "Web application",
      status: "CONCEPT",
      technologies: ["Next.js"],
      features: [],
      thumbnailUrl: null,
      imageUrls: [],
      liveUrl: null,
      sourceUrl: null,
      isFeatured: false,
      isPublished: false,
      publishedAt: null,
      isSample: true,
      isArchived: false,
      createdAt: new Date("2026-10-01T10:00:00Z"),
      updatedAt: new Date("2026-10-01T10:00:00Z"),
    },
  ];

  const repositories = {
    dashboard: {
      async getSummary() {
        return {
          inquiries: { total: 1, new: 1, pending: 0 },
          projects: { total: 1, active: 1 },
          clients: { total: 1, active: 1 },
          recentInquiries: inquiries.map((inquiry) => ({
            id: inquiry._id,
            name: inquiry.name,
            email: inquiry.email,
            company: inquiry.company,
            service: inquiry.service,
            status: inquiry.status,
            createdAt: inquiry.createdAt,
            updatedAt: inquiry.updatedAt,
          })),
        };
      },
      async getDashboard({ clientId }) {
        const clientProjects = projects.filter(
          (project) => String(project.clientId?._id ?? project.clientId) === clientId,
        );
        const projectIds = new Set(clientProjects.map((project) => String(project._id)));
        const active = clientProjects.filter((project) =>
          ACTIVE_PROJECT_STATUSES.includes(project.status),
        );
        const upcoming = milestones
          .filter(
            (milestone) =>
              projectIds.has(String(milestone.projectId)) &&
              milestone.status !== "COMPLETED" &&
              milestone.dueDate &&
              milestone.dueDate >= new Date("2026-10-20T00:00:00Z"),
          )
          .sort((a, b) => a.dueDate - b.dueDate)
          .map((milestone) => ({
            ...milestone,
            projectName:
              clientProjects.find(
                (project) => String(project._id) === String(milestone.projectId),
              )?.name ?? null,
          }));
        const activity = updates
          .filter(
            (update) =>
              update.visibility === "CLIENT" &&
              projectIds.has(String(update.projectId)),
          )
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((update) => ({
            ...update,
            projectName:
              clientProjects.find(
                (project) => String(project._id) === String(update.projectId),
              )?.name ?? null,
          }));

        const counts = new Map();
        for (const project of clientProjects) {
          const projectMilestones = milestones.filter(
            (milestone) => String(milestone.projectId) === String(project._id),
          );
          counts.set(String(project._id), {
            total: projectMilestones.length,
            completed: projectMilestones.filter(
              (milestone) => milestone.status === "COMPLETED",
            ).length,
          });
        }

        return {
          stats: {
            activeProjects: active.length,
            upcomingMilestones: upcoming.length,
            completedMilestones: clientProjects.reduce(
              (total, project) =>
                total + (counts.get(String(project._id))?.completed ?? 0),
              0,
            ),
          },
          activeProjects: active,
          recentlyUpdatedProjects: [...clientProjects].sort(
            (a, b) => b.updatedAt - a.updatedAt,
          ),
          milestoneCounts: counts,
          upcomingMilestones: upcoming,
          recentActivity: activity,
        };
      },
    },
    inquiries: {
      async list(query) {
        const filtered = query.status
          ? inquiries.filter((item) => item.status === query.status)
          : inquiries;
        return { items: filtered, total: filtered.length };
      },
      async findById(id) {
        return inquiries.find((item) => item._id === id) ?? null;
      },
      async updateStatus({ id, status, changedBy }) {
        const inquiry = inquiries.find((item) => item._id === id);
        if (!inquiry) return null;
        inquiry.status = status;
        inquiry.statusChangedAt = new Date();
        inquiry.statusChangedBy = changedBy;
        return inquiry;
      },
    },
    clients: {
      async list(query) {
        const filtered = query.status
          ? clients.filter((item) => item.status === query.status)
          : clients;
        return { items: filtered, total: filtered.length };
      },
      async findById(id) {
        return clients.find((item) => item._id === id) ?? null;
      },
      async findByEmail(email) {
        return (
          clients.find((item) => item.primaryEmail === email.toLowerCase()) ?? null
        );
      },
      async findActiveByUserId(userId) {
        return (
          clients.find(
            (item) => item.userId === userId && item.status === "ACTIVE",
          ) ?? null
        );
      },
      async findByPortalUserId(userId) {
        return clients.find((item) => item.userId === userId) ?? null;
      },
      async linkPortalUser({ id, userId, linkedBy }) {
        const client = clients.find((item) => item._id === id);
        if (!client) return null;
        client.userId = userId;
        client.portalLinkedAt = new Date();
        client.portalLinkedBy = linkedBy;
        client.updatedBy = linkedBy;
        return client;
      },
      async unlinkPortalUser({ id, updatedBy }) {
        const client = clients.find((item) => item._id === id);
        if (!client) return null;
        delete client.userId;
        delete client.portalLinkedAt;
        delete client.portalLinkedBy;
        client.updatedBy = updatedBy;
        return client;
      },
      async create(data) {
        const client = {
          _id: "64b000000000000000000099",
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        clients.push(client);
        return client;
      },
      async update({ id, changes }) {
        const client = clients.find((item) => item._id === id);
        if (!client) return null;
        Object.assign(client, changes, { updatedAt: new Date() });
        return client;
      },
    },
    projects: {
      async list(query) {
        let filtered = projects;
        if (query.status) {
          filtered = filtered.filter((item) => item.status === query.status);
        }
        if (query.clientId) {
          filtered = filtered.filter(
            (item) => String(item.clientId?._id) === query.clientId,
          );
        }
        return { items: filtered, total: filtered.length };
      },
      async findById(id) {
        return projects.find((item) => item._id === id) ?? null;
      },
      async findRawById(id) {
        return projects.find((item) => item._id === id) ?? null;
      },
      async listByClientId(clientId) {
        return projects.filter((item) => String(item.clientId?._id) === clientId);
      },
      async create(data) {
        const project = {
          _id: generatedId(),
          ...data,
          clientId:
            clients.find((item) => String(item._id) === String(data.clientId)) ??
            data.clientId,
          links: data.links ?? [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        projects.push(project);
        return project;
      },
      async update({ id, changes }) {
        const project = projects.find((item) => item._id === id);
        if (!project) return null;
        for (const [key, value] of Object.entries(changes)) {
          if (value === null) delete project[key];
          else project[key] = value;
        }
        project.updatedAt = new Date();
        return project;
      },
      async updateStatus({ id, status, changedBy }) {
        const project = projects.find((item) => item._id === id);
        if (!project) return { kind: "not_found" };
        if (project.status === status) return { kind: "ok", project };
        if (!(PROJECT_STATUS_TRANSITIONS[project.status] ?? []).includes(status)) {
          return { kind: "invalid", currentStatus: project.status };
        }
        project.status = status;
        project.statusChangedAt = new Date();
        project.statusChangedBy = changedBy;
        project.updatedBy = changedBy;
        if (status === "COMPLETED") project.completedAt = new Date();
        else delete project.completedAt;
        return { kind: "ok", project };
      },
      async touch({ id, updatedBy }) {
        const project = projects.find((item) => item._id === id);
        if (project) {
          project.updatedAt = new Date();
          project.updatedBy = updatedBy;
        }
      },
      async listForClient({ clientId, page, limit, status }) {
        let filtered = projects.filter(
          (item) => String(item.clientId?._id ?? item.clientId) === clientId,
        );
        if (status) filtered = filtered.filter((item) => item.status === status);
        return {
          items: filtered.slice((page - 1) * limit, page * limit),
          total: filtered.length,
        };
      },
      async findForClient({ id, clientId }) {
        return (
          projects.find(
            (item) =>
              String(item._id) === id &&
              String(item.clientId?._id ?? item.clientId) === clientId,
          ) ?? null
        );
      },
      async listActiveForClient({ clientId, limit }) {
        return projects
          .filter(
            (item) =>
              String(item.clientId?._id ?? item.clientId) === clientId &&
              ACTIVE_PROJECT_STATUSES.includes(item.status),
          )
          .slice(0, limit);
      },
      async listRecentForClient({ clientId, limit }) {
        return projects
          .filter(
            (item) => String(item.clientId?._id ?? item.clientId) === clientId,
          )
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, limit);
      },
      async countActiveForClient(clientId) {
        return projects.filter(
          (item) =>
            String(item.clientId?._id ?? item.clientId) === clientId &&
            ACTIVE_PROJECT_STATUSES.includes(item.status),
        ).length;
      },
    },
    milestones: {
      async listForProject(projectId) {
        return milestones
          .filter((item) => String(item.projectId) === String(projectId))
          .sort((a, b) => a.sortOrder - b.sortOrder);
      },
      async findForProject({ id, projectId }) {
        return (
          milestones.find(
            (item) =>
              String(item._id) === id && String(item.projectId) === String(projectId),
          ) ?? null
        );
      },
      async create(data) {
        const projectMilestones = milestones.filter(
          (item) => String(item.projectId) === String(data.projectId),
        );
        const sortOrder =
          data.sortOrder ??
          (projectMilestones.length
            ? Math.max(...projectMilestones.map((item) => item.sortOrder)) + 1
            : 0);
        const milestone = {
          _id: generatedId(),
          ...data,
          sortOrder,
          completedAt: data.status === "COMPLETED" ? new Date() : undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        milestones.push(milestone);
        return milestone;
      },
      async update({ id, projectId, changes, expectedStatus }) {
        const milestone = milestones.find(
          (item) =>
            String(item._id) === id && String(item.projectId) === String(projectId),
        );
        if (!milestone) return null;
        if (expectedStatus && milestone.status !== expectedStatus) return null;
        for (const [key, value] of Object.entries(changes)) {
          if (value === null) delete milestone[key];
          else milestone[key] = value;
        }
        if (milestone.status === "COMPLETED" && !milestone.completedAt) {
          milestone.completedAt = new Date();
        }
        if (milestone.status !== "COMPLETED") delete milestone.completedAt;
        milestone.updatedAt = new Date();
        return milestone;
      },
      async countsForProjects(projectIds) {
        const ids = new Set(projectIds.map(String));
        const counts = new Map();
        for (const projectId of ids) {
          const projectMilestones = milestones.filter(
            (item) => String(item.projectId) === projectId,
          );
          counts.set(projectId, {
            total: projectMilestones.length,
            completed: projectMilestones.filter(
              (item) => item.status === "COMPLETED",
            ).length,
          });
        }
        return counts;
      },
      async listUpcomingForClient({ clientId, now = new Date(), limit }) {
        const projectIds = new Set(
          projects
            .filter(
              (item) =>
                String(item.clientId?._id ?? item.clientId) === clientId &&
                !["COMPLETED", "CANCELLED"].includes(item.status),
            )
            .map((item) => String(item._id)),
        );
        return milestones
          .filter(
            (item) =>
              projectIds.has(String(item.projectId)) &&
              item.status !== "COMPLETED" &&
              item.dueDate &&
              item.dueDate >= now,
          )
          .sort((a, b) => a.dueDate - b.dueDate)
          .slice(0, limit)
          .map((item) => ({
            ...item,
            projectName:
              projects.find((project) => String(project._id) === String(item.projectId))
                ?.name ?? null,
          }));
      },
      async countUpcomingForClient({ clientId, now = new Date() }) {
        const items = await this.listUpcomingForClient({
          clientId,
          now,
          limit: 1000,
        });
        return items.length;
      },
      async countCompletedForClient(clientId) {
        const projectIds = new Set(
          projects
            .filter(
              (item) => String(item.clientId?._id ?? item.clientId) === clientId,
            )
            .map((item) => String(item._id)),
        );
        return milestones.filter(
          (item) =>
            projectIds.has(String(item.projectId)) && item.status === "COMPLETED",
        ).length;
      },
    },
    updates: {
      async listForProject({ projectId, page = 1, limit = 20, visibility }) {
        let filtered = updates.filter(
          (item) => String(item.projectId) === String(projectId),
        );
        if (visibility) {
          filtered = filtered.filter((item) => item.visibility === visibility);
        }
        filtered = filtered.sort((a, b) => b.createdAt - a.createdAt);
        return {
          items: filtered.slice((page - 1) * limit, page * limit),
          total: filtered.length,
        };
      },
      async findForProject({ id, projectId }) {
        return (
          updates.find(
            (item) =>
              String(item._id) === id && String(item.projectId) === String(projectId),
          ) ?? null
        );
      },
      async create(data) {
        const update = {
          _id: generatedId(),
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        updates.push(update);
        return update;
      },
      async update({ id, projectId, changes }) {
        const update = updates.find(
          (item) =>
            String(item._id) === id && String(item.projectId) === String(projectId),
        );
        if (!update) return null;
        Object.assign(update, changes, { updatedAt: new Date() });
        return update;
      },
      async listRecentForClient({ clientId, limit }) {
        const projectIds = new Set(
          projects
            .filter(
              (item) =>
                String(item.clientId?._id ?? item.clientId) === clientId &&
                item.status !== "CANCELLED",
            )
            .map((item) => String(item._id)),
        );
        return updates
          .filter(
            (item) =>
              projectIds.has(String(item.projectId)) &&
              item.visibility === "CLIENT",
          )
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, limit)
          .map((item) => ({
            ...item,
            projectName:
              projects.find((project) => String(project._id) === String(item.projectId))
                ?.name ?? null,
          }));
      },
    },
    services: {
      async list(query) {
        let filtered = services;
        if (query.published !== undefined) {
          filtered = filtered.filter(
            (item) => item.isPublished === query.published,
          );
        }
        if (!query.includeArchived) {
          filtered = filtered.filter((item) => !item.isArchived);
        }
        return { items: filtered, total: filtered.length };
      },
      async findById(id) {
        return services.find((item) => item._id === id) ?? null;
      },
      async findBySlug(slug) {
        return services.find((item) => item.slug === slug) ?? null;
      },
      async create(data) {
        const service = {
          _id: "64b000000000000000000098",
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        services.push(service);
        return service;
      },
      async update({ id, changes }) {
        const service = services.find((item) => item._id === id);
        if (!service) return null;
        Object.assign(service, changes, { updatedAt: new Date() });
        return service;
      },
      async archive({ id, updatedBy }) {
        const service = services.find((item) => item._id === id);
        if (!service) return null;
        service.isArchived = true;
        service.isPublished = false;
        service.updatedBy = updatedBy;
        return service;
      },
    },
    portfolio: {
      async list(query) {
        let filtered = portfolio;
        if (query.published !== undefined) {
          filtered = filtered.filter(
            (item) => item.isPublished === query.published,
          );
        }
        if (!query.includeArchived) {
          filtered = filtered.filter((item) => !item.isArchived);
        }
        return { items: filtered, total: filtered.length };
      },
      async findById(id) {
        return portfolio.find((item) => item._id === id) ?? null;
      },
      async create(data) {
        const entry = {
          _id: "64b000000000000000000097",
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        portfolio.push(entry);
        return entry;
      },
      async update({ id, changes, updatedBy }) {
        const entry = portfolio.find((item) => item._id === id);
        if (!entry) return null;
        Object.assign(entry, changes, { updatedBy, updatedAt: new Date() });
        if (changes.isPublished === true && !entry.publishedAt) {
          entry.publishedAt = new Date();
        }
        if (changes.isPublished === false) {
          entry.isFeatured = false;
        }
        return entry;
      },
      async archive({ id, updatedBy }) {
        const entry = portfolio.find((item) => item._id === id);
        if (!entry) return null;
        entry.isArchived = true;
        entry.isPublished = false;
        entry.isFeatured = false;
        entry.updatedBy = updatedBy;
        return entry;
      },
    },
  };

  return {
    repositories,
    data: {
      inquiries,
      clients,
      projects,
      milestones,
      updates,
      services,
      portfolio,
    },
  };
}

export async function startAdminTestServer(repositories) {
  const server = await startAuthTestServer({
    appOptions: { adminRepositories: repositories },
  });
  return server;
}

export async function createSignedInUser(app, role = "ADMIN") {
  const { email } = await createTestUser(app.auth, { role });
  const { cookie } = await signIn(app.baseUrl, { email });
  return { cookie, email };
}

export async function jsonRequest(
  baseUrl,
  path,
  { method = "GET", cookie, origin = TRUSTED_ORIGIN, body } = {},
) {
  const headers = { accept: "application/json" };
  if (cookie) headers.cookie = cookie;
  if (origin !== null) headers.origin = origin;
  if (body !== undefined) headers["content-type"] = "application/json";

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  return { response, json };
}
