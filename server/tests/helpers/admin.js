import {
  createTestUser,
  signIn,
  startAuthTestServer,
  TRUSTED_ORIGIN,
} from "./auth.js";

export { TRUSTED_ORIGIN };

export const IDS = {
  inquiry: "64b000000000000000000001",
  client: "64b000000000000000000002",
  project: "64b000000000000000000003",
  service: "64b000000000000000000004",
  portfolio: "64b000000000000000000005",
};

/** A complete in-memory set of admin repositories for DB-free HTTP tests. */
export function createFakeAdminRepositories() {
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
      createdAt: new Date("2026-10-01T10:00:00Z"),
      updatedAt: new Date("2026-10-02T10:00:00Z"),
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
      async listByClientId(clientId) {
        return projects.filter((item) => String(item.clientId?._id) === clientId);
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

  return { repositories, data: { inquiries, clients, projects, services, portfolio } };
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
