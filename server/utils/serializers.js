import { INQUIRY_STATUS_TRANSITIONS } from "../constants/inquiry.js";
import { MILESTONE_STATUS_TRANSITIONS } from "../constants/milestone.js";
import { PROJECT_STATUS_TRANSITIONS } from "../constants/project.js";

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

export function serializeProjectDetail(project, { milestoneCounts } = {}) {
  return {
    ...serializeProjectSummary(project),
    description: project.description ?? null,
    links: (project.links ?? []).map((link) => ({
      label: link.label,
      url: link.url,
    })),
    completedAt: date(project.completedAt),
    statusChangedAt: date(project.statusChangedAt),
    createdAt: date(project.createdAt),
    allowedNextStatuses: [...(PROJECT_STATUS_TRANSITIONS[project.status] ?? [])],
    milestoneCounts: milestoneCounts ?? { total: 0, completed: 0 },
  };
}

function normalizeMilestoneCounts(counts) {
  return {
    total: counts?.total ?? 0,
    completed: counts?.completed ?? 0,
  };
}

export function serializePortalProjectSummary(project, counts) {
  return {
    id: id(project._id ?? project.id),
    name: project.name,
    status: project.status,
    startDate: date(project.startDate),
    dueDate: date(project.dueDate),
    updatedAt: date(project.updatedAt),
    milestoneCounts: normalizeMilestoneCounts(counts),
  };
}

export function serializePortalProjectDetail(project, counts) {
  return {
    ...serializePortalProjectSummary(project, counts),
    description: project.description ?? null,
    completedAt: date(project.completedAt),
    createdAt: date(project.createdAt),
    links: (project.links ?? []).map((link) => ({
      label: link.label,
      url: link.url,
    })),
  };
}

export function serializeMilestone(milestone) {
  return {
    id: id(milestone._id ?? milestone.id),
    projectId: id(milestone.projectId),
    title: milestone.title,
    description: milestone.description ?? null,
    status: milestone.status,
    dueDate: date(milestone.dueDate),
    completedAt: date(milestone.completedAt),
    sortOrder: milestone.sortOrder ?? 0,
    createdAt: date(milestone.createdAt),
    updatedAt: date(milestone.updatedAt),
    allowedNextStatuses: [
      ...(MILESTONE_STATUS_TRANSITIONS[milestone.status] ?? []),
    ],
  };
}

/** Portal milestones do not expose workflow transition metadata. */
export function serializePortalMilestone(milestone) {
  const serialized = serializeMilestone(milestone);
  delete serialized.allowedNextStatuses;
  return serialized;
}

export function serializeProjectUpdate(update) {
  return {
    id: id(update._id ?? update.id),
    projectId: id(update.projectId),
    title: update.title,
    body: update.body,
    visibility: update.visibility,
    authorId: update.authorId,
    authorName: update.authorName,
    createdAt: date(update.createdAt),
    updatedAt: date(update.updatedAt),
  };
}

/** Portal updates omit internal visibility and author identifiers. */
export function serializePortalProjectUpdate(update) {
  return {
    id: id(update._id ?? update.id),
    projectId: id(update.projectId),
    title: update.title,
    body: update.body,
    authorName: update.authorName,
    createdAt: date(update.createdAt),
    updatedAt: date(update.updatedAt),
  };
}

export function serializePortalActivity(update) {
  return {
    id: id(update._id ?? update.id),
    projectId: id(update.projectId),
    projectName: update.projectName ?? null,
    title: update.title,
    body: update.body,
    authorName: update.authorName,
    createdAt: date(update.createdAt),
  };
}

export function serializePortalUpcomingMilestone(milestone) {
  return {
    id: id(milestone._id ?? milestone.id),
    projectId: id(milestone.projectId),
    projectName: milestone.projectName ?? null,
    title: milestone.title,
    status: milestone.status,
    dueDate: date(milestone.dueDate),
  };
}

export function serializePortalAccess(user) {
  if (!user) return null;
  return {
    userId: id(user.id ?? user._id),
    name: user.name ?? null,
    email: user.email ?? null,
    linkedAt: date(user.linkedAt),
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
