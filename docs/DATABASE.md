# Growers Journy — Database Design

**Project:** Growers Journy  
**Database:** MongoDB Atlas  
**ODM:** Mongoose  
**Backend:** Node.js + Express.js + TypeScript  
**Document Type:** Database Architecture and Implementation Guide

---

## 1. Purpose

Design a secure, maintainable, and scalable database for the Growers Journy agency platform.

The database must support:

- Public website content
- Service management
- Dynamic portfolio
- Inquiry and lead tracking
- Admin and team management
- Client management
- Project tracking
- Milestones and project updates
- Invoices and payments
- Notifications
- Audit events
- AI usage tracking

Implement only the collections required for the current development phase. Do not build the entire database before the related features are ready.

---

## 2. Database Principles

1. Use MongoDB Atlas for hosted database infrastructure.
2. Use Mongoose for application-domain data models.
3. Keep database access inside the backend.
4. Validate all incoming data before database writes.
5. Use explicit schemas rather than unrestricted objects.
6. Add timestamps to records that require lifecycle tracking.
7. Use references when records have independent lifecycles or many-to-many relationships.
8. Embed small, bounded data when it naturally belongs to a parent record.
9. Add indexes based on access patterns and uniqueness requirements.
10. Never store passwords, payment card details, or unnecessary sensitive data in custom application models.
11. Define ownership and deletion policies before implementing destructive operations.
12. Never commit real database credentials to Git.

---

## 3. Database Naming

Recommended database name:

```text
growers_journy
```

Use consistent collection and model naming.

Example:

- Mongoose model: `Inquiry`
- Collection: `inquiries`
- Mongoose model: `PortfolioProject`
- Collection: `portfolioprojects`, unless an explicit collection name is configured

**Important:** Configure explicit collection names where predictable naming is beneficial. Do not assume Mongoose will automatically produce every desired collection name.

---

## 4. Collection Overview

| Collection              | Purpose                                            | Priority                            |
| ----------------------- | -------------------------------------------------- | ----------------------------------- |
| `users`                 | Application user profiles                          | Required for authenticated features |
| Better Auth collections | Sessions, accounts, verification data as supported | Required for authentication         |
| `services`              | Agency service catalog                             | Phase 2                             |
| `portfolioprojects`     | Published work and case studies                    | Phase 2                             |
| `inquiries`             | Contact submissions and lead tracking              | Phase 3                             |
| `clients`               | Agency client records                              | Phase 5                             |
| `projects`              | Client projects and project status                 | Phase 5                             |
| `projectmemberships`    | User access to projects                            | Phase 5                             |
| `milestones`            | Project milestones                                 | Phase 5                             |
| `projectupdates`        | Project progress updates                           | Phase 5                             |
| `invoices`              | Billing documents                                  | Implemented (Task 09)              |
| `invoice_counters`      | Atomic per-prefix/year invoice numbering           | Implemented (Task 09)              |
| `payments`              | Payment attempts and verified payment records      | Implemented (Task 09)              |
| `payment_events`        | Provider event ledger and duplicate-delivery guard | Implemented (Task 09)              |
| `payment_refunds`       | Provider-confirmed refund records                  | Implemented (Task 09)              |
| `notifications`         | User notifications                                 | As needed                           |
| `audit_events`          | Important administrative actions                   | Implemented for finance (Task 09)   |
| `aiusagerecords`        | AI usage and cost metadata                         | When AI features launch             |

Names above describe the intended logical collections. Authentication collection names and fields follow the official Better Auth MongoDB adapter configuration. With `better-auth@1.7.11` and `@better-auth/mongo-adapter@1.7.11` the defaults are:

| Collection | Purpose |
| --- | --- |
| `user` | Identity: id, name, email, emailVerified, image, role, banned, timestamps |
| `session` | Active sessions: token, expiry, IP/user-agent, user reference |
| `account` | Credential records: provider id, scrypt password hash, provider account id |
| `verification` | Short-lived verification/reset tokens (unused until email delivery exists) |

These are separate from the application's `clients`/`projects`/`invoices` collections. The authentication adapter owns their schema; do not add Mongoose models for them or edit password hashes by hand.

---

## 5. User Profile Model

The application may need a user profile model separate from authentication records.

### Implemented now

Better Auth's `user` collection is the authoritative source for `id`, `name`, `email`, and `role`. Roles are the exact strings `ADMIN`, `TEAM_MEMBER`, and `CLIENT` in the admin-plugin `role` field. Password hashes live only in `account.password` (scrypt, salted) and are never copied elsewhere.

There is no separate `users` profile collection yet. Adding one later should reference the Better Auth user id and must not duplicate the email, password, session, or role as competing sources of truth. If a display name or avatar is needed, prefer Better Auth's `user` fields; if business-specific profile data is needed, store it in a `clientProfiles`/`teamProfiles`-style collection keyed by the auth user id.

### Suggested future fields

```ts
type UserRole = "ADMIN" | "TEAM_MEMBER" | "CLIENT";

interface UserProfile {
  authUserId: string;
  displayName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Rules

- `authUserId` identifies the user in the trusted authentication system.
- Add a unique index to `authUserId`.
- Normalize email consistently and enforce uniqueness only according to the chosen identity model.
- Never accept a role assignment from public registration input.
- Provision the first administrator using a secure server-side process.
- Deactivate accounts when access must be revoked.
- Do not duplicate authentication passwords, sessions, or account secrets in this model.

If Better Auth already provides the fields required by the application, avoid unnecessary duplicated user data. Choose one authoritative source for each field.

---

## 6. Service Model

Purpose: Store agency services managed by an administrator.

### Suggested fields

```ts
interface Service {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  icon?: string;
  features: string[];
  isPublished: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Rules

- `slug` must be unique.
- Validate title and description lengths.
- Keep `features` bounded and validated.
- Public APIs must return only published services.
- Restrict creation, modification, and deletion to authorized staff.

Do not store arbitrary executable content in service records.

---

## 7. Portfolio Project Model

Purpose: Manage dynamic case studies and published work.

### Suggested fields

```ts
interface PortfolioProject {
  title: string;
  slug: string;
  summary: string;
  problem?: string;
  solution?: string;
  features: string[];
  technologies: string[];
  thumbnailUrl?: string;
  imageUrls: string[];
  liveUrl?: string;
  sourceUrl?: string;
  category?: string;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Rules

- Enforce a unique slug.
- Validate external URLs.
- Limit image and technology array sizes.
- Only return published projects from public endpoints.
- Do not fabricate project metrics, testimonials, or client claims.
- Keep confidential client work private unless publication is authorized.

If category management becomes complex, replace the string category with a validated reference to a category collection.

---

## 8. Inquiry Model

Purpose: Save contact form submissions and manage the sales pipeline.

### Suggested fields

```ts
type InquiryStatus = "NEW" | "REVIEWING" | "QUALIFIED" | "CONVERTED" | "CLOSED";

interface Inquiry {
  name: string;
  email: string;
  company?: string;
  service: string;
  projectDescription: string;
  budget?: string;
  timeline?: string;
  referenceUrl?: string;
  status: InquiryStatus;
  source?: string;
  assignedTo?: string;
  notes?: string;
  convertedClientId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Rules

- Validate required fields and maximum lengths.
- Normalize email addresses consistently.
- Apply rate limiting before accepting repeated submissions.
- Treat notes and descriptions as untrusted user content.
- Never render stored user content as trusted HTML.
- Restrict internal notes to authorized staff.
- Keep lead status changes auditable.
- Define a retention policy for abandoned or closed leads.
- Do not use email alone as proof of identity.

`assignedTo` and `convertedClientId` should use the chosen identifier type consistently. If these become MongoDB references, define the corresponding schema references rather than leaving them as arbitrary strings.

### Implemented in Task 05

`server/models/inquiry.js` implements the model for the public contact form. The
same limits live in `server/constants/inquiry.js` and are enforced again by the
Zod schema in `server/validators/inquiry.js`.

| Field                | Stored as  | Rule                                                        |
| -------------------- | ---------- | ----------------------------------------------------------- |
| `name`               | String     | required, trimmed, 2–100                                    |
| `email`              | String     | required, trimmed, lower-cased, ≤254                        |
| `company`            | String     | optional, trimmed, ≤120; blank is stored as absent          |
| `service`            | String     | required enum: the four public service slugs                 |
| `projectDescription` | String     | required, trimmed, 20–5000                                  |
| `budget`             | String     | optional, ≤100; blank is stored as absent                   |
| `timeline`           | String     | optional, ≤100; blank is stored as absent                   |
| `referenceUrl`       | String     | optional, normalized `http(s)` URL, ≤2048                   |
| `status`             | String     | enum, required, default `NEW`; never accepted from a request |
| `statusChangedAt`    | Date       | set by the admin status endpoint; absent initially           |
| `statusChangedBy`    | String     | safe user id of the admin who changed the status             |
| `createdAt`/`updatedAt` | Date    | Mongoose `timestamps: true`                                 |

- Collection: `inquiries` (explicit, not inferred).
- Index: `{ createdAt: -1 }`, `{ status: 1, createdAt: -1 }`, and
  `{ service: 1, createdAt: -1 }`, for the admin list and filters.
- No unique index on `email`; one person may legitimately submit more than once.
- `notes`, `assignedTo`, and `convertedClientId` are **not** implemented yet.
  They belong to the admin phase and must never be writable by the public route.
- Task 07 adds `statusChangedAt` and `statusChangedBy`. The admin PATCH endpoint
  accepts only `{ status }`; the actor comes from the validated session, not the
  request body. Status transitions are defined in `server/constants/inquiry.js`
  and validated before the write.
- The raw network address used for rate limiting is held in memory by the rate
  limiter and is not stored on the inquiry.

---

## 9. Client Model

Purpose: Represent a business or person receiving agency services.

### Suggested fields

```ts
interface Client {
  displayName: string;
  companyName?: string;
  primaryEmail: string;
  phone?: string;
  userId?: string;
  status: "ACTIVE" | "INACTIVE";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Rules

- A client record and an authenticated client user are different concepts.
- A client may be created before portal access is provisioned.
- Link `userId` to the appropriate application user when portal access exists.
- Do not grant portal access simply because an email matches a client record.
- Restrict internal notes to authorized staff.
- Decide whether the system supports multiple users per client before expanding the model.

If multiple people from one client organization need access, use a client membership model instead of relying on a single `userId`.

---

## 10. Project Model

Purpose: Track contracted client work.

### Suggested fields

```ts
type ProjectStatus =
  | "PLANNING"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

interface Project {
  name: string;
  description: string;
  clientId: string;
  status: ProjectStatus;
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Rules

- `clientId` must reference a valid client record.
- `createdBy` must reference a valid user.
- Validate date ranges.
- Define valid status transitions in the service layer.
- Do not accept client ownership changes from an ordinary client request.
- Restrict private project fields to authorized users.
- Do not rely on the project ID alone to authorize access.

Use Mongoose references or a consistent identifier type for all relationship fields.

### Implemented in Task 07 and Task 08

The admin models exist now. They are intentionally narrower than the future
target above, and no production seed data is inserted.

| Model / collection       | Implemented fields and rules |
| ------------------------ | ---------------------------- |
| `Client` / `clients`     | `displayName` (2–120), `companyName` (≤160), unique lowercase `primaryEmail` (≤254), `phone` (≤40), `status` `ACTIVE`/`INACTIVE` (default `ACTIVE`), optional internal `notes` (≤5000), optional `userId` link to a Better Auth account, `portalLinkedAt`/`portalLinkedBy`, `updatedBy`, timestamps. Indexes: unique `primaryEmail`, unique sparse `userId`, `displayName`, `status + createdAt`. |
| `Project` / `projects`   | `name` (2–160), optional `description` (≤5000), required `clientId` reference, status enum `PLANNING`/`IN_PROGRESS`/`ON_HOLD`/`COMPLETED`/`CANCELLED`, optional `startDate`/`dueDate`/`completedAt`, `statusChangedAt`/`statusChangedBy`, up to 10 external `links` (`label`, `url`), `createdBy`/`updatedBy`, timestamps. A pre-validation hook rejects `dueDate` before `startDate`. Indexes: `clientId + status + updatedAt`, `clientId + updatedAt`, `status + updatedAt`, `createdAt`. |
| `Milestone` / `milestones` | `projectId` reference, `title` (2–160), optional `description` (≤2000), status `PENDING`/`IN_PROGRESS`/`COMPLETED`/`BLOCKED` (default `PENDING`), optional `dueDate`/`completedAt`, `sortOrder` (0–9999), `createdBy`/`updatedBy`, timestamps. `completedAt` is derived from status in a pre-validation hook. Indexes: `projectId + sortOrder`, `projectId + dueDate`, `projectId + status`. |
| `ProjectUpdate` / `projectupdates` | `projectId` reference, `title` (2–160), `body` (2–5000), visibility `INTERNAL`/`CLIENT` (default `INTERNAL`), required `authorId`/`authorName`, `updatedBy`, timestamps. Indexes: `projectId + visibility + createdAt`, `projectId + createdAt`. |
| `Service` / `services`   | `title`, immutable unique `slug`, `summary`, optional `description`/`audience`, icon allowlist, bounded `problems`/`deliverables`/`capabilities`/`technologies` arrays, `isPublished`, `isArchived`, `sortOrder` (0–9999), `updatedBy`, timestamps. Indexes: unique `slug`, `isArchived + isPublished + sortOrder`. |
| `PortfolioProject` / `portfolioprojects` | `title`, immutable unique `slug`, `summary`, optional `description`/`category`, status `CONCEPT`/`IN_PROGRESS`/`COMPLETED`, bounded `technologies`/`features`/`imageUrls`, validated optional `thumbnailUrl`/`liveUrl`/`sourceUrl`, `isFeatured`, `isPublished`, `publishedAt`, `isSample` (default `true`), `isArchived`, `updatedBy`, timestamps. Indexes: unique `slug`, publication/featured index, `category`. |

Task 08 implements one portal login per client record through `Client.userId`.
Multiple contacts for one client require a future membership/invitation model.
A client record is still not an authentication account, and linking an account is
an explicit ADMIN action. There is no automatic link based on a matching email.

Project memberships are still **not implemented**. Invoices, payments, payment
events, refunds, invoice counters, and finance audit events are implemented by
Task 09 (see sections 14–16). Projects, milestones, and updates are never
hard-deleted; projects are cancelled and child records are edited.

`isSample` defaults to `true` deliberately. Publishing real case studies
requires an explicit administrator decision; the model has no testimonial,
rating, logo, or outcome-metric fields.

---

## 11. Project Membership Model

Purpose: Define which users can access a project.

### Suggested fields

```ts
interface ProjectMembership {
  projectId: string;
  userId: string;
  accessRole: "PROJECT_MANAGER" | "CONTRIBUTOR" | "CLIENT_VIEWER";
  createdAt: Date;
  updatedAt: Date;
}
```

### Rules

- Add a unique compound index on `projectId` and `userId`.
- Verify membership on every protected project operation.
- Prevent users from creating or upgrading their own memberships.
- Allow only authorized administrators to assign team access.
- Do not treat `CLIENT_VIEWER` as permission to access another client's resources.

The final authorization rules must account for client ownership and project membership together.

---

## 12. Milestone Model

Purpose: Track project stages and delivery progress.

### Suggested fields

```ts
interface Milestone {
  projectId: string;
  title: string;
  description?: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
  dueDate?: Date;
  completedAt?: Date;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Rules

- Every milestone must belong to an existing project.
- Validate status transitions.
- Use `sortOrder` to control display order.
- Validate completion timestamps against the current status.
- Expose only client-approved information through the portal.

Do not calculate overall project completion from milestone counts unless the product explicitly defines that calculation.

---

## 13. Project Update Model

Purpose: Record progress updates visible to authorized users.

### Suggested fields

```ts
interface ProjectUpdate {
  projectId: string;
  authorId: string;
  title: string;
  body: string;
  visibility: "INTERNAL" | "CLIENT";
  createdAt: Date;
  updatedAt: Date;
}
```

### Rules

- Validate that the author is authorized to publish the update.
- Client endpoints must exclude `INTERNAL` updates.
- Never trust a frontend-provided visibility value without permission checks.
- Record important changes in the audit trail.
- Avoid embedding unrestricted HTML or executable content.

---

## 14. Invoice Model

Purpose: Represent a billing document issued to a client.

**Implemented in Task 09** in `server/models/invoice.js`, collection
`invoices`. The model stores server-calculated values only.

```ts
type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "VOID";

interface InvoiceLineItem {
  description: string;
  quantityMilli: number; // 1.5 is stored as 1500
  unitAmountMinor: number;
  lineTotalMinor: number;
}

interface Invoice {
  invoiceNumber?: string; // optional on a draft; generated at issue
  clientId: ObjectId; // Client
  projectId?: ObjectId; // Project
  status: InvoiceStatus;
  currency: "BDT" | string; // validated against the enabled currency list
  lineItems: InvoiceLineItem[];
  subtotalMinor: number;
  discountMinor: number;
  taxRateBps: number;
  taxMinor: number;
  totalMinor: number;
  amountPaidMinor: number; // sum of verified payment amounts
  amountRefundedMinor: number; // sum of verified refunds
  balanceDueMinor: number; // derived: total - (paid - refunded)
  overpaidMinor: number; // derived: max(0, net paid - total)
  issueDate?: Date;
  dueDate?: Date;
  issuedAt?: Date;
  voidedAt?: Date;
  voidReason?: string;
  notes?: string; // client-visible
  internalNotes?: string; // admin only, never serialized to portal
  createdBy?: string;
  updatedBy?: string;
  issuedBy?: string;
  voidedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Monetary representation

V1 is BDT-only. Amounts are integer poisha (1 BDT = 100 poisha). Quantities are
integer thousandths. Stored totals are never floating-point. The server
recalculates line totals, subtotal, discount, tax, and total on every draft
write and at issue; request body totals, payment state, and status are rejected
by the strict validators.

### Rules

- Calculate all amounts on the server.
- Never trust client-submitted totals, paid amounts, refunds, or status.
- Enforce a unique sparse `invoiceNumber`. The atomic `invoice_counters`
  collection supplies `PREFIX-YYYY-NNNNNN` at issue. A duplicate returns `409
  INVOICE_NUMBER_CONFLICT`.
- Only `DRAFT` is editable. Issued invoices are immutable; corrections use a
  refund or void workflow.
- An invoice with net verified payments cannot be voided. Refund first.
- `PAID`, `PARTIALLY_PAID`, and `OVERDUE` are derived from verified money and
  the due date, not from a browser claim. There is no scheduled status job.
- Preserve issued invoice history. There is no hard delete.
- Use a transaction when a payment/refund changes both the payment and invoice
  records.

Indexes: unique sparse `invoiceNumber`; `clientId + createdAt`;
`clientId + status + createdAt`; `status + dueDate`; `projectId + createdAt`.

---

## 15. Payment Model

Purpose: Record payment attempts, provider events, and verified payment outcomes.

**Implemented in Task 09** in `server/models/payment.js` and
`server/models/payment-event.js`, collections `payments` and `payment_events`.

```ts
type PaymentStatus =
  | "INITIATED"
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

interface Payment {
  invoiceId: ObjectId;
  clientId: ObjectId;
  provider: "FAKE"; // PAYMENT_PROVIDERS currently has only the sandbox adapter
  environment: "SANDBOX" | "LIVE";
  providerTransactionId?: string; // unique sparse
  providerPaymentId?: string; // unique sparse, set from a verified event
  idempotencyKey?: string; // unique sparse
  amountMinor: number;
  appliedAmountMinor: number;
  overpaidMinor: number;
  refundedAmountMinor: number;
  currency: string;
  status: PaymentStatus;
  providerMethod?: string;
  initiatedByUserId?: string;
  initiatedAt?: Date;
  verifiedAt?: Date;
  failedAt?: Date;
  safeFailureCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentEvent {
  provider: string;
  eventId: string;
  eventType: string;
  payloadHash: string; // SHA-256, not the raw provider payload
  paymentId: ObjectId;
  invoiceId: ObjectId;
  status: "RECEIVED" | "PROCESSED" | "IGNORED" | "FAILED";
  attempts: number;
  safeErrorCode?: string;
  receivedAt: Date;
  processedAt?: Date;
}

interface PaymentRefund {
  paymentId: ObjectId;
  invoiceId: ObjectId;
  provider: string;
  providerRefundId?: string; // unique sparse
  amountMinor: number;
  status: "REQUESTED" | "PENDING" | "SUCCEEDED" | "FAILED";
  reason?: string;
  initiatedBy?: string;
  completedAt?: Date;
  safeErrorCode?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Rules

- Verify payment status on the server.
- Verify webhook authenticity against the original raw body before parsing or
  applying the event.
- The unique `(provider, eventId)` index is the duplicate-delivery guard. A
  duplicate returns success without crediting the invoice twice.
- Recheck the payment id, invoice id, provider transaction id, amount, and
  currency against the stored attempt before applying a successful event.
- A browser redirect is never proof of payment.
- Never store full card numbers, security codes, raw provider payloads, or
  payment credentials.
- A successful payment increments `invoice.amountPaidMinor` once. Partial
  payments are allowed; the invoice status is derived from the net verified
  ledger.
- Refunds are separate append-only records and are applied only after provider
  confirmation. The payment's refunded amount cannot exceed its captured
  amount; a conditional write bounds concurrent refund attempts.
- Use a transaction for the payment + invoice + event + refund writes when
  `MONGODB_TRANSACTIONS` is enabled. Atlas replica sets support this.
- The only implemented provider is `FAKE`; no real provider contract is claimed.

---

## 16. Notification Model

Purpose: Store notifications for authenticated users.

### Suggested fields

```ts
interface Notification {
  userId: string;
  type: string;
  title: string;
  message: string;
  targetUrl?: string;
  readAt?: Date;
  createdAt: Date;
}
```

### Rules

- A user can read or mark as read only their own notifications.
- Validate internal target URLs to avoid unsafe redirects.
- Do not put secrets or unnecessary sensitive data in notification messages.
- Add an index on `userId` and `createdAt`.
- Define a retention policy if notification volume grows.

---

## 17. Audit Event Model

Purpose: Record important security and administrative actions.

### Suggested fields

```ts
interface AuditEvent {
  actorUserId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  requestId?: string;
  outcome: "SUCCESS" | "FAILURE";
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
```

### Audit-worthy actions

- Administrator provisioning.
- Role or membership changes.
- Client access changes.
- Invoice issuance, voiding, or amendment.
- Payment verification and refunds.
- Sensitive settings changes.
- AI or MCP actions with significant side effects.

### Rules

- Never store passwords, access tokens, API keys, or full payment credentials.
- Sanitize metadata before persistence.
- Restrict audit access.
- Avoid unrestricted user-controlled objects in metadata.
- Define retention and access policies.
- Use append-only behavior for ordinary application users.

A database audit collection is useful for application events but does not replace infrastructure-level security logging.

---

## 18. AI Usage Record Model

Create this collection only when AI functionality is implemented.

### Suggested fields

```ts
interface AIUsageRecord {
  userId?: string;
  feature: string;
  provider: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;
  status: "SUCCESS" | "FAILURE";
  durationMs?: number;
  createdAt: Date;
}
```

### Rules

- Record only the metadata needed for usage monitoring.
- Do not store full prompts or outputs by default.
- Avoid storing confidential client content.
- Treat cost values as estimates unless reconciled against provider billing.
- Apply usage limits and appropriate access controls.
- Do not trust model-generated user IDs or permission claims.

---

## 19. Index Strategy

Create indexes based on actual queries and uniqueness requirements.

| Collection          | Suggested index                                                       |
| ------------------- | --------------------------------------------------------------------- |
| User profiles       | Unique `authUserId`                                                   |
| Services            | Unique `slug`; `isPublished` + `sortOrder`                            |
| Portfolio projects  | Unique `slug`; `isPublished` + `publishedAt`                          |
| Inquiries           | `status` + `createdAt`; `assignedTo` + `status`                       |
| Clients             | Index `primaryEmail` as appropriate                                   |
| Projects            | `clientId` + `status`; `createdAt`                                    |
| Project memberships | Unique `projectId` + `userId`                                         |
| Milestones          | `projectId` + `sortOrder`                                             |
| Project updates     | `projectId` + `createdAt`                                             |
| Invoices            | Unique sparse `invoiceNumber`; `clientId` + `status` + `createdAt`; `status` + `dueDate` |
| Invoice counters    | `_id` is `invoice:PREFIX:YEAR`; atomic `sequence` |
| Payments            | `invoiceId` + `createdAt`; unique sparse `provider` + `providerTransactionId`, `provider` + `providerPaymentId`, `idempotencyKey` |
| Payment events      | Unique `provider` + `eventId`; `status` + `receivedAt` |
| Payment refunds     | Unique sparse `provider` + `providerRefundId`; `paymentId` + `createdAt` |
| Notifications       | `userId` + `createdAt`                                                |
| Audit events        | `createdAt`; `actorUserId` + `createdAt`                              |
| AI usage records    | `userId` + `createdAt`                                                |

Before adding an index, confirm that it supports an actual query or integrity requirement.

Compound indexes should match the application's filtering and sorting patterns. Avoid unnecessary indexes because they consume storage and increase write costs.

---

## 20. Data Relationships

Conceptual relationships:

```text
UserProfile
   |
   +---- ProjectMembership ---- Project
   |                              |
   |                              +---- Milestones
   |                              |
   |                              +---- ProjectUpdates
   |
   +---- Notifications

Client
   |
   +---- Projects
   |
   +---- Invoices
              |
              +---- Payments

Inquiry
   |
   +---- Optional converted Client

Service
   |
   +---- Public Website

PortfolioProject
   |
   +---- Public Case Study
```

Use explicit MongoDB references for independently managed entities.

Embedding may be appropriate for bounded invoice items or small, tightly coupled values. Do not embed an unlimited number of updates, notifications, or payment events into one document.

---

## 21. Validation and Integrity

Validate all writes at the service or API boundary.

Examples:

- Required fields cannot be empty.
- Slugs must follow a defined format.
- URLs must use allowed protocols.
- Numeric values must be within acceptable limits.
- Dates must be valid and logically consistent.
- Enumerated statuses must match approved values.
- Relationship IDs must reference existing records.
- Invoice totals must match server-calculated values.
- Duplicate payment events must not create duplicate financial effects.

Mongoose schema validation is an additional protection layer, not a substitute for API validation and authorization.

Where multiple writes must remain consistent, evaluate MongoDB transactions and the requirements of the deployed Atlas cluster.

---

## 22. Data Security and Privacy

- Keep MongoDB access on the backend.
- Use least-privilege database credentials.
- Keep production and development databases separate.
- Restrict Atlas network access.
- Never return raw documents containing private fields.
- Enforce tenant and ownership boundaries on the server.
- Sanitize data before rendering or logging.
- Avoid collecting information the agency does not need.
- Define backup, restoration, and retention policies.
- Define how account deactivation and deletion affect related records.
- Preserve financial and audit records when legally or operationally required.
- Review applicable privacy and business obligations before launching.

Do not delete a client, project, invoice, or payment blindly when related records need to be retained. Implement an explicit lifecycle policy.

---

## 23. Database Connection Configuration

Keep database configuration in the backend.

The connection string is read from the server-only `MONGODB_URI` variable, which must include the database name. The implemented shape is:

```js
// server/config/database.js
import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
  await mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });
  return mongoose.connection;
}
```

Configuration is validated before this runs (`server/config/env.js`), and `server/index.js` connects before it starts listening for requests.

This is a minimal illustrative example of the real code. Production startup must also handle connection failures, process shutdown, logging, and health checks appropriately.

Rules:

- Validate environment variables during startup.
- Never print the full database URL.
- Do not continue serving database-dependent routes when the database is unavailable.
- Reuse the application's managed connection.
- Handle graceful shutdown.
- Verify connectivity before declaring the service healthy.

If Better Auth uses a separate official MongoDB client adapter, manage its lifecycle carefully and avoid creating unnecessary duplicate connections.

---

## 24. Database Migration and Change Strategy

MongoDB does not use relational schema migrations in exactly the same way as SQL databases, but production schema changes still require controlled procedures.

For each structural change:

1. Document the old and new schema.
2. Identify existing records affected.
3. Write a migration or backfill script if required.
4. Test the change on development or staging data.
5. Make the migration repeatable where practical.
6. Create or update indexes safely.
7. Verify results before deployment.
8. Document rollback or recovery options.

Never run an untested destructive migration against production data.

---

## 25. Implementation Order

Build database features in this order:

### Phase 1

- Configure MongoDB Atlas.
- Configure environment validation.
- Implement the database connection.
- Verify backend health checks.
- Establish consistent ID and timestamp conventions.

### Phase 2

- Create Service and PortfolioProject models.
- Add public read queries.
- Add publication controls and indexes.

### Phase 3

- Create the Inquiry model.
- Implement validation and persistence.
- Add lead status management.
- Test inquiry access permissions.

### Phase 4

- Verify Better Auth's database adapter.
- Establish the application user-profile relationship.
- Implement secure administrator provisioning.

### Phase 5

- ~~Create Client, Project, Milestone, and ProjectUpdate models.~~ (Tasks 07–08:
  implemented)
- Create ProjectMembership (still not implemented).
- ~~Add ownership checks.~~ (Tasks 07–08: implemented)
- ~~Test cross-client access restrictions.~~ (Tasks 07–08: implemented)

### Phase 6

- ~~Create Invoice and Payment models.~~ (Task 09: implemented)
- ~~Implement financial validation.~~ (Task 09: implemented)
- ~~Add verified payment processing and idempotency.~~ (Task 09: implemented for
  the `FAKE` sandbox)
- Add a real provider and reconcile its sandbox before live payments.

### Phase 7

- ~~Add AuditEvent.~~ (Task 09: implemented for finance; broader audit coverage
  is still pending)
- Add Notifications when delivery is implemented.
- Add AIUsageRecord only when required.
- Review retention, privacy, and operational monitoring.

---

## 26. OpenCode Instructions

When implementing this database design:

1. Inspect the existing repository and installed dependencies first.
2. Read `PRD.md`, `DESIGN.md`, and `ARCHITECTURE.md`.
3. Verify current Mongoose and Better Auth documentation before implementation.
4. Do not invent adapter APIs or authentication collection structures.
5. Create models only for the current development phase.
6. Use TypeScript and explicit schema types.
7. Define references and indexes intentionally.
8. Keep database operations in backend services.
9. Test validation, unique constraints, and authorization boundaries.
10. Never seed production with fake clients, payments, testimonials, or financial records.
11. Use clearly identified development-only seed data where needed.
12. Never expose database credentials.
13. Document changes to fields, indexes, and relationships.
14. Explain unfamiliar database concepts in beginner-friendly language.
15. Do not mark a model or workflow complete until the relevant tests pass.

---

## 27. Definition of Done

A database feature is complete when:

- Its schema is defined.
- Required validation is implemented.
- Relationships are documented.
- Necessary indexes are configured.
- Authorization requirements are identified.
- Sensitive fields are protected.
- Relevant tests pass.
- Failure cases are handled.
- Documentation reflects the implemented design.
