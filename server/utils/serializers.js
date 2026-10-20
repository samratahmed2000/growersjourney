import { INQUIRY_STATUS_TRANSITIONS } from "../constants/inquiry.js";

/**
 * Safe API projections.
 *
 * Routes must never return a raw Mongoose document: it can contain `__v`,
 * populated account data, or fields that were added later without a security
 * review. These functions are the single place where a database record becomes
 * an API response.
 */

function id(value) {
  if (!value) return null;
  return typeof value === "string" ? value : String(value);
}

function date(value) {
  return value ? new Date(value).toISOString() : null;
}

export function serializeInquirySummary(inquiry) {
  return {
    id: id(inquiry._id ?? inquiry.id),
    name: inquiry.name,
    email: inquiry.email,
    company: inquiry.company ?? null,
    service: inquiry.service,
    status: inquiry.status,
    createdAt: date(inquiry.createdAt),
    updatedAt: date(inquiry.updatedAt),
  };
}

export function serializeInquiryDetail(inquiry) {
  return {
    ...serializeInquirySummary(inquiry),
    projectDescription: inquiry.projectDescription,
    budget: inquiry.budget ?? null,
    timeline: inquiry.timeline ?? null,
    referenceUrl: inquiry.referenceUrl ?? null,
    statusChangedAt: date(inquiry.statusChangedAt),
    allowedNextStatuses: [...(INQUIRY_STATUS_TRANSITIONS[inquiry.status] ?? [])],
  };
}

export function serializeClientSummary(client) {
  return {
    id: id(client._id ?? client.id),
    displayName: client.displayName,
    companyName: client.companyName ?? null,
    primaryEmail: client.primaryEmail,
    phone: client.phone ?? null,
    status: client.status,
    createdAt: date(client.createdAt),
    updatedAt: date(client.updatedAt),
  };
}

export function serializeClientDetail(client) {
  return {
    ...serializeClientSummary(client),
    notes: client.notes ?? null,
  };
}

function serializeProjectClient(client) {
  if (!client) return null;
  if (typeof client === "string") return { id: client };
  return {
    id: id(client._id ?? client.id),
    displayName: client.displayName ?? "Unknown client",
    companyName: client.companyName ?? null,
    primaryEmail: client.primaryEmail ?? null,
    status: client.status ?? null,
  };
}

export function serializeProjectSummary(project) {
  return {
    id: id(project._id ?? project.id),
    name: project.name,
    status: project.status,
    client: serializeProjectClient(project.clientId),
    startDate: date(project.startDate),
    dueDate: date(project.dueDate),
    updatedAt: date(project.updatedAt),
  };
}

export function serializeProjectDetail(project) {
  return {
    ...serializeProjectSummary(project),
    description: project.description ?? null,
    completedAt: date(project.completedAt),
    createdAt: date(project.createdAt),
  };
}

export function serializeService(service) {
  return {
    id: id(service._id ?? service.id),
    title: service.title,
    slug: service.slug,
    summary: service.summary,
    description: service.description ?? null,
    icon: service.icon,
    audience: service.audience ?? null,
    problems: service.problems ?? [],
    deliverables: service.deliverables ?? [],
    capabilities: service.capabilities ?? [],
    technologies: service.technologies ?? [],
    isPublished: Boolean(service.isPublished),
    isArchived: Boolean(service.isArchived),
    sortOrder: service.sortOrder ?? 0,
    createdAt: date(service.createdAt),
    updatedAt: date(service.updatedAt),
  };
}

export function serializePortfolio(project) {
  return {
    id: id(project._id ?? project.id),
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    description: project.description ?? null,
    category: project.category ?? null,
    status: project.status,
    technologies: project.technologies ?? [],
    features: project.features ?? [],
    thumbnailUrl: project.thumbnailUrl ?? null,
    imageUrls: project.imageUrls ?? [],
    liveUrl: project.liveUrl ?? null,
    sourceUrl: project.sourceUrl ?? null,
    isFeatured: Boolean(project.isFeatured),
    isPublished: Boolean(project.isPublished),
    publishedAt: date(project.publishedAt),
    isSample: Boolean(project.isSample),
    isArchived: Boolean(project.isArchived),
    createdAt: date(project.createdAt),
    updatedAt: date(project.updatedAt),
  };
}
