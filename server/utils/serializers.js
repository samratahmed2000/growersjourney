import { INQUIRY_STATUS_TRANSITIONS } from "../constants/inquiry.js";
import { MILESTONE_STATUS_TRANSITIONS } from "../constants/milestone.js";
import { PROJECT_STATUS_TRANSITIONS } from "../constants/project.js";
import { deriveInvoiceStatus } from "./invoice-status.js";
import { balanceDueMinor, overpaidMinor } from "./money.js";

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
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
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

function serializeInvoiceClient(client) {
  if (!client) return null;
  if (typeof client === "string") return { id: client };
  return {
    id: id(client._id ?? client.id),
    displayName: client.displayName ?? null,
    companyName: client.companyName ?? null,
    primaryEmail: client.primaryEmail ?? null,
    status: client.status ?? null,
  };
}

function serializeInvoiceProject(project) {
  if (!project) return null;
  if (typeof project === "string") return { id: project };
  return {
    id: id(project._id ?? project.id),
    name: project.name ?? null,
    status: project.status ?? null,
  };
}

function quantityFromMilli(quantityMilli) {
  const value = Number(quantityMilli) / 1000;
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function invoiceStatusFor(invoice, options) {
  if (options.effectiveStatus === false) return invoice.status;
  return deriveInvoiceStatus({
    currentStatus: invoice.status,
    totalMinor: invoice.totalMinor,
    amountPaidMinor: invoice.amountPaidMinor,
    amountRefundedMinor: invoice.amountRefundedMinor,
    dueDate: invoice.dueDate,
    graceDays: options.overdueGraceDays ?? 0,
    now: options.now ?? new Date(),
    timeZone: options.timezone ?? "UTC",
  });
}

function invoiceBalance(invoice) {
  return balanceDueMinor({
    totalMinor: invoice.totalMinor,
    amountPaidMinor: invoice.amountPaidMinor,
    amountRefundedMinor: invoice.amountRefundedMinor,
  });
}

function invoiceOverpaid(invoice) {
  return overpaidMinor({
    totalMinor: invoice.totalMinor,
    amountPaidMinor: invoice.amountPaidMinor,
    amountRefundedMinor: invoice.amountRefundedMinor,
  });
}

function invoiceAllowedActions(invoice, status) {
  if (status === "DRAFT") return ["edit", "issue", "void"];
  if (status === "VOID" || status === "PAID") return [];
  const netPaid = Math.max(
    0,
    (invoice.amountPaidMinor ?? 0) - (invoice.amountRefundedMinor ?? 0),
  );
  return netPaid === 0 ? ["void"] : [];
}

export function serializeInvoiceSummary(invoice, options = {}) {
  const status = invoiceStatusFor(invoice, options);
  const balance = invoiceBalance(invoice);

  return {
    id: id(invoice._id ?? invoice.id),
    invoiceNumber: invoice.invoiceNumber ?? null,
    client: serializeInvoiceClient(invoice.clientId),
    project: serializeInvoiceProject(invoice.projectId),
    status,
    currency: invoice.currency,
    totalMinor: invoice.totalMinor,
    amountPaidMinor: invoice.amountPaidMinor ?? 0,
    amountRefundedMinor: invoice.amountRefundedMinor ?? 0,
    balanceDueMinor: balance,
    overpaidMinor: invoiceOverpaid(invoice),
    issueDate: date(invoice.issueDate),
    dueDate: date(invoice.dueDate),
    createdAt: date(invoice.createdAt),
    updatedAt: date(invoice.updatedAt),
    canPay:
      Boolean(options.paymentsEnabled) &&
      ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(status) &&
      balance > 0,
  };
}

export function serializeInvoiceDetail(invoice, options = {}) {
  const summary = serializeInvoiceSummary(invoice, options);

  return {
    ...summary,
    notes: invoice.notes ?? null,
    internalNotes: options.includeInternal
      ? invoice.internalNotes ?? null
      : undefined,
    lineItems: (invoice.lineItems ?? []).map((item) => ({
      description: item.description,
      quantityMilli: item.quantityMilli,
      quantity: quantityFromMilli(item.quantityMilli),
      unitAmountMinor: item.unitAmountMinor,
      lineTotalMinor: item.lineTotalMinor,
    })),
    subtotalMinor: invoice.subtotalMinor,
    discountMinor: invoice.discountMinor ?? 0,
    taxRateBps: invoice.taxRateBps ?? 0,
    taxMinor: invoice.taxMinor ?? 0,
    issuedAt: date(invoice.issuedAt),
    voidedAt: date(invoice.voidedAt),
    voidReason: invoice.voidReason ?? null,
    allowedActions: invoiceAllowedActions(invoice, summary.status),
  };
}

function serializePaymentRefund(refund) {
  return {
    id: id(refund._id ?? refund.id),
    amountMinor: refund.amountMinor,
    status: refund.status,
    reason: refund.reason ?? null,
    providerRefundId: refund.providerRefundId ?? null,
    createdAt: date(refund.createdAt),
    completedAt: date(refund.completedAt),
  };
}

export function serializePaymentSummary(payment, options = {}) {
  return {
    id: id(payment._id ?? payment.id),
    invoiceId: id(payment.invoiceId),
    clientId: options.includeClient ? id(payment.clientId) : undefined,
    provider: payment.provider,
    environment: payment.environment,
    amountMinor: payment.amountMinor,
    appliedAmountMinor: payment.appliedAmountMinor ?? 0,
    overpaidMinor: payment.overpaidMinor ?? 0,
    refundedAmountMinor: payment.refundedAmountMinor ?? 0,
    currency: payment.currency,
    status: payment.status,
    method: payment.providerMethod ?? null,
    safeFailureCode: options.includeInternal
      ? payment.safeFailureCode ?? null
      : undefined,
    providerTransactionId: options.includeProviderRefs
      ? payment.providerTransactionId ?? null
      : undefined,
    providerPaymentId: options.includeProviderRefs
      ? payment.providerPaymentId ?? null
      : undefined,
    initiatedAt: date(payment.initiatedAt),
    verifiedAt: date(payment.verifiedAt),
    failedAt: date(payment.failedAt),
    createdAt: date(payment.createdAt),
    updatedAt: date(payment.updatedAt),
  };
}

export function serializePaymentDetail(payment, options = {}) {
  const summary = serializePaymentSummary(payment, options);
  return {
    ...summary,
    invoice:
      payment.invoiceId && typeof payment.invoiceId === "object"
        ? serializeInvoiceSummary(payment.invoiceId, options)
        : null,
    refunds: (payment.refunds ?? []).map(serializePaymentRefund),
  };
}

export function serializePortalPayment(payment) {
  return serializePaymentSummary(payment, { includeClient: false });
}

export function serializePortalInvoiceSummary(invoice, options = {}) {
  return serializeInvoiceSummary(invoice, options);
}

export function serializePortalInvoiceDetail(invoice, options = {}) {
  const serialized = serializeInvoiceDetail(invoice, {
    ...options,
    includeInternal: false,
  });
  // Admin workflow metadata and internal void notes are not part of the client
  // contract.
  delete serialized.allowedActions;
  delete serialized.voidReason;
  return serialized;
}
