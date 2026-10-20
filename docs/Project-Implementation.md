# Project Implementation Guide — Growers Journy

## 1. Purpose

This document defines the step-by-step implementation strategy for the Growers Journy website and agency management platform.

The goal is to build a professional, secure, responsive, and scalable application while keeping the development process understandable for a beginner-to-intermediate developer.

**Project:** Growers Journy  
**Tagline:** Build Smarter. Grow Faster.  
**Developer:** Samrat Ahmed  
**Role:** AI-Driven Web Application Engineer (MERN)

## 2. Mandatory Instructions for OpenCode

Before writing or modifying code:

1. Read `AGENTS.md`, `PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, and `README.md`.
2. Inspect the entire relevant repository structure.
3. Identify existing dependencies, scripts, environment variables, and implemented features.
4. Compare the current state against the documentation.
5. Prepare a short implementation plan before making substantial changes.

Follow these rules throughout development:

- Implement one phase at a time.
- Prefer small, understandable changes over large rewrites.
- Reuse existing components and utilities where appropriate.
- Do not overwrite working code without justification.
- Do not invent credentials, API responses, testimonials, client records, or business metrics.
- Never expose secrets in frontend code or Git.
- Do not mark a feature complete until it has been verified.
- Explain important decisions, new files, and commands in beginner-friendly language.
- Ask for clarification when a decision affects architecture, security, financial processing, or irreversible changes.
- Do not proceed with destructive operations without explicit approval.

## 3. Implementation Strategy

Use the following phases in order. A phase may be adjusted when repository inspection reveals an existing implementation or a genuine dependency.

<text color="secondary" size="sm">Each phase has a defined completion gate. Do not skip verification simply to move faster.</text>

### Phase 1 — Repository Audit and Foundation

**Objectives**

- Inspect the current repository and Git status.
- Confirm whether frontend and backend applications already exist.
- Verify the Node.js version, package manager, dependencies, and scripts.
- Establish a maintainable folder structure.
- Configure TypeScript, linting, formatting, and environment templates as needed.

**Tasks**

- Preserve existing work.
- Create missing project configuration only when necessary.
- Configure `.gitignore`.
- Add health-check and startup validation foundations where appropriate.
- Document local development commands.

**Completion gate**

- Frontend and backend foundations can start using verified project commands.
- No real credentials are committed.
- Existing functionality still works.

### Phase 2 — Design System and Public Website

**Objectives**
Build the public-facing website before adding complex management features.

**Brand guidelines**

- Primary green: `#123C2D`
- Accent green: `#16A36A`
- White and neutral surfaces for readability.
- Premium, minimal, professional visual language.
- Responsive layouts with accessible interactions.

**Public routes**

- `/`
- `/services`
- `/work`
- `/work/[slug]`
- `/about`
- `/process`
- `/contact`
- `/privacy-policy`
- `/terms`

**Tasks**

- Build reusable navigation, footer, buttons, cards, forms, and layout components.
- Create the homepage hero, services, selected projects, agency process, technology stack, founder introduction, FAQs, and calls to action.
- Add responsive navigation and mobile layouts.
- Use genuine project information only.
- Include testimonials only when verified testimonials are available.
- Add page metadata, semantic HTML, and accessible labels.

**Completion gate**

- All implemented public routes render correctly.
- Layouts work on mobile, tablet, and desktop.
- No critical navigation, console, or accessibility issues remain.

### Phase 3 — Backend Foundation

**Objectives**
Create the independent Express REST API.

**Tasks**

- Configure the backend application and TypeScript.
- Establish a modular route, controller, service, validation, and data-access structure.
- Configure environment-variable validation.
- Connect to MongoDB Atlas using Mongoose.
- Add centralized error handling.
- Add request logging without sensitive information.
- Implement a health endpoint.
- Add baseline security headers, CORS policy, and appropriate rate limits.

**Suggested module boundaries**

- Configuration
- Database
- Middleware
- Routes
- Controllers
- Services
- Models
- Validation
- Utilities
- Tests

Avoid unnecessary abstractions. Keep the structure appropriate for the application's actual size.

**Completion gate**

- The API starts reliably.
- Database connectivity is verified.
- Invalid requests produce consistent errors.
- Secrets are loaded from server-side environment variables.

### Phase 4 — Database Models and Public APIs

**Objectives**
Implement the initial data models and public read endpoints.

**Tasks**

- Implement service and portfolio models.
- Add schemas, indexes, and validation based on `DATABASE.md`.
- Create public endpoints for published services and portfolio projects.
- Add pagination and filtering where appropriate.
- Keep unpublished or private records inaccessible to public requests.
- Use controlled seed data only when needed for development.

**Completion gate**

- API responses follow `API.md`.
- Validation and error handling work.
- Private and unpublished content is not exposed.
- Database indexes support the expected query patterns.

### Phase 5 — Contact Form and Lead Management

**Objectives**
Build the full inquiry lifecycle.

**Tasks**

- Implement the contact form in the frontend.
- Validate fields on both client and server.
- Submit inquiries to the backend.
- Persist valid inquiries in MongoDB.
- Send an email notification through a configured provider.
- Track email delivery failures without losing the saved inquiry.
- Add spam protection and rate limiting.
- Implement inquiry statuses: `NEW`, `REVIEWING`, `QUALIFIED`, `CONVERTED`, and `CLOSED`.
- Build the administrative inquiry list and inquiry detail view.
- Add follow-up notes and status-change controls with authorization.

**Completion gate**

- Valid inquiries are saved.
- Invalid and abusive requests are rejected safely.
- Email failures are handled gracefully.
- Only authorized staff can view and manage leads.

### Phase 6 — Authentication and Authorization

**Objectives**
Introduce secure sign-in and role-based access.

**Tasks**

- Verify the compatibility of Better Auth with the selected database and backend architecture.
- Configure authentication using the documented, supported integration.
- Establish roles: `ADMIN`, `TEAM_MEMBER`, and `CLIENT`.
- Provision the initial administrator securely.
- Protect administrative and client routes.
- Enforce permissions on the server, not just in the UI.
- Verify session handling, cookie settings, trusted origins, and logout behavior.
- Ensure Express endpoints independently enforce authentication and authorization.

**Important**
Do not assume that a protected Next.js page secures the API behind it. Verify how Express validates the authenticated session or trusted credentials using the selected integration.

**Completion gate**

- Unauthenticated users cannot access protected resources.
- Team members cannot perform administrator-only actions.
- Clients can access only records they are authorized to view.
- Users cannot elevate their own roles.

**Task 06 status**

Implemented and verified:

- Better Auth 1.7.11 in Express, MongoDB adapter, fixed 7-day HttpOnly/SameSite cookie, secure cookie on HTTPS, origin CSRF checks, sign-in rate limiting, and logout revocation.
- Roles `ADMIN`, `TEAM_MEMBER`, `CLIENT`; protected `/api/v1/auth/me`, `/api/v1/admin/access`, and `/api/v1/portal/access`; default-deny for unknown roles.
- Secure first-admin provisioning (`npm run create-admin`), public sign-up disabled, role field not writable by clients.
- Protected Next.js `/admin` and `/portal` layouts with loading, unauthenticated redirect, and forbidden states.
- 100/100 server tests, plus a live rewrite smoke test.

Partially verified or deferred:

- Object-level isolation helpers (`ownedByQuery`, `assertResourceOwner`) are implemented and unit-tested, but no project/invoice routes exist yet, so the "clients see only their records" gate will be fully exercised in Phase 7/8.
- Real MongoDB persistence, `create-admin` against Atlas, and HTTPS secure-cookie behavior were not verified in this environment.
- Password reset, email verification, and invitation flows are deferred with email delivery.

### Phase 7 — Admin Dashboard

**Objectives**
Create a practical agency operations dashboard.

**Features**

- Overview of inquiry and project activity.
- Inquiry management.
- Client management.
- Project and milestone management.
- Service and portfolio content management.
- Invoice management.
- Notifications and settings where implemented.

**Tasks**

- Build reusable dashboard layouts and navigation.
- Add loading, empty, error, and success states.
- Add pagination and search for larger datasets.
- Validate mutations on the backend.
- Record important administrative actions where appropriate.

**Completion gate**

- Dashboard data comes from authorized APIs.
- All implemented mutations persist correctly.
- Role restrictions work on the server.
- Mobile and desktop dashboard layouts are usable.

**Task 07 status**

Implemented:

- ADMIN-only `/admin` dashboard and sidebar, with responsive mobile navigation.
- Dashboard summary, inquiry list/detail/status transitions, client list/create/edit/deactivate and linked projects, read-only project list/detail, service CRUD plus archive/restore, and portfolio CRUD plus archive/restore.
- Strict server validation, pagination, search/filter/sort allowlists, object id validation, duplicate-email/slug handling, safe archive instead of hard delete, and no internal error leakage.
- 19 Task 07 server tests (API access/validation/status/CRUD/failure, plus model/validator tests). Full server suite: 119 tests.
- Client lint, typecheck, and production build pass; the build reports 39 route entries.

Deliberately not implemented in Task 07:

- Inquiry delete/assign/notes/conversion, project writes, memberships, milestones, project updates, invoices, payments, team management, portal features, AI features, and public content migration. Public `/services` and `/work` remain static.
- Real MongoDB/Atlas persistence, real admin records, and browser automation were not verified in this environment because `server/.env` lacks the required database/auth values and the client has no browser test runner.

### Phase 8 — Client Portal and Project Tracking

**Objectives**
Give each client secure visibility into their own work.

**Features**

- Client dashboard.
- Project status and milestones.
- Project updates.
- Authorized documents.
- Invoice history and payment status.

**Tasks**

- Define project membership and ownership rules.
- Implement project and milestone APIs.
- Implement updates and notifications where required.
- Restrict document access.
- Verify authorization on every client-specific API operation.

**Project statuses**

- `PLANNING`
- `IN_PROGRESS`
- `ON_HOLD`
- `COMPLETED`
- `CANCELLED`

**Completion gate**

- Clients can view only authorized projects.
- Cross-client data access is blocked and tested.
- Project updates and milestones display accurate server data.

**Task 08 status**

Implemented:

- `/portal` dashboard, `/portal/projects`, and `/portal/projects/[id]` with project status, milestone timeline, safe external links, and client-visible progress updates.
- `/portal/invoices` was a deliberate placeholder at the end of Task 08; Task 09
  replaced it with invoice list/detail/print and payment history. Real provider
  payments remain unimplemented.
- ADMIN project create/edit, active-client assignment, status workflow, milestone create/edit, and internal/client-visible updates, all under `/api/v1/admin`.
- Explicit client portal linking on the client record. One linked Better Auth `CLIENT` account per client; no automatic email matching and no account invitation flow.
- Object-level authorization in Express. Another client's project, milestone, or update returns `404`; role-only portal access returns `403 PORTAL_ACCESS_DENIED`.
- 15 Task 08 server tests plus the existing suite: **134 tests, all passing**.
- Client lint, typecheck, and production build pass; the build reports 41 route entries.

Deliberately not implemented in Task 08:

- Project memberships, team-member project access, invoice/payment features, notifications, file storage/upload, AI features, and public content migration.
- Real MongoDB/Atlas persistence and live Better Auth records were not verified because required server environment values are not configured here.
- Browser interaction, responsive visual checks, and screen-reader checks were not run; the client has no browser/test runner.

### Phase 9 — Invoices and Payment Integration

**Objectives**
Implement invoice management and, when configured, payment processing.

**Tasks**

- Define invoice items, currency, totals, due dates, and statuses.
- Calculate all financial totals on the server.
- Add invoice creation, editing, issuing, and voiding workflows.
- Store payment records separately from invoices.
- Integrate a selected payment provider only after its requirements are confirmed.
- Verify webhook signatures.
- Handle retries and duplicate webhook events idempotently.
- Reconcile payment events with invoice balances.

**Invoice statuses**

- `DRAFT`
- `ISSUED`
- `PARTIALLY_PAID`
- `PAID`
- `OVERDUE`
- `VOID`

**Completion gate**

- Invoice totals cannot be manipulated through client input.
- Payment status changes are based on verified server-side events.
- Duplicate webhooks do not create duplicate payments.
- Financial records have appropriate access controls and auditability.

**Task 09 status**

Implemented:

- Server-calculated invoices with BDT integer minor units, fractional quantity
  thousandths, explicit draft/issue/void lifecycle, atomic invoice numbering,
  and `ISSUED` / `PARTIALLY_PAID` / `PAID` / `OVERDUE` derived at read time.
  `DRAFT` and `VOID` remain explicit lifecycle states.
- Admin invoice list/create/edit/detail/print pages and invoice actions. The
  client and portal invoice list/detail/print pages are implemented; drafts are
  excluded and cross-client records return `404`.
- Verified payment ledger with partial payments, provider event deduplication,
  signed webhook processing, refunds, and a reconciliation hook.
- Provider-independent service boundary and a local `FAKE` sandbox adapter with
  clearly labelled mock checkout. The adapter is refused in production.
- Admin payment list/detail, refund, and reconcile UI; portal payment history
  and payment-result page.
- Finance environment validation and safe `.env.example` names. No real provider
  credentials, card data, tax rules, or fee/settlement terms were invented.
- 15 new server tests plus the existing suite: **149 tests, all passing**. The
  client lint, typecheck, and production build pass.

Deliberately not implemented in Task 09:

- Any real payment provider (SSLCommerz, aamarPay, or another). Merchant
  approval, credentials, currency support, fee/settlement, refund behavior, and
  webhook contracts are still unconfirmed.
- PDF generation, email delivery, automatic invoice reminders, scheduled
  overdue status persistence, client invitation/provisioning, and live client
  payment testing against a real provider.
- Live MongoDB/Atlas persistence of the new finance collections was not verified
  in this environment. The test suite uses in-memory finance repositories; the
  database write path is implemented but needs a manual smoke test.
- Refunds are provider-first. If the provider confirms a refund but the database
  transaction then fails, the refund exists at the provider while the local
  ledger still needs reconciliation. Run the manual reconciliation check; do not
  silently retry a potentially completed refund.

**Production Readiness Pass (active Task 10) status**

Implemented and verified locally:

- Explicit `NODE_ENV` validation (`development` / `test` / `production`). An
  explicit mode is required when payments are enabled, and the `FAKE` provider
  is rejected in production.
- Baseline security headers on the Next.js site and every API response, with
  HSTS only when the API is in production. A full nonce-based CSP is not
  implemented.
- Payment-session hardening: required idempotency key, reuse of an active attempt
  for the same invoice/amount, and `409 PAYMENT_ALREADY_PENDING` for a conflicting
  amount. The browser also guards against double submits.
- `/dev/health` is rewritten to a real 404 in production.
- Draft legal pages are `noindex` until owner/legal review.
- Additive index creation script (`npm run db:indexes`) for the unique webhook
  and payment idempotency indexes.
- Server-side admin/portal API response validation rejects malformed envelopes.
- Admin error and invoice/payment loading states; portal invoice loading state.
- Deployment, backup/recovery, release-checklist, and rollback documentation.
- Server suite: **155 tests, all passing**. Client lint, typecheck, and production
  build pass.

Still unresolved (do not describe as production-ready):

- Legal copy approval, real payment provider, production/Atlas finance smoke
  test, email delivery, notifications, client provisioning, project memberships,
  shared rate-limit store, APM/metrics/alerting, automated browser/accessibility
  tests, full CSP, and dynamic public services/portfolio.
- Refund reconciliation after a provider success + database failure remains a
  manual operational edge case.

### Phase 10 — Notifications and Automation

**Objectives**
Reduce repetitive administrative work.

**Tasks**

- Create reusable email templates.
- Notify appropriate recipients about inquiry and project events.
- Add invoice notifications where applicable.
- Handle retries and delivery failures.
- Prevent duplicate or unauthorized notifications.
- Keep provider credentials server-side.

**Completion gate**

- Notifications are sent only for configured events.
- Failures are observable and recoverable.
- Sensitive client information is not unnecessarily exposed in emails or logs.

### Phase 11 — AI Integration and MCP Foundation

**Objectives**
Prepare a secure foundation for useful AI-powered workflows.

**Tasks**

- Define concrete business use cases before adding AI features.
- Keep AI provider logic behind server-side service modules.
- Validate user input and model output.
- Apply usage limits, authorization, logging, and error handling.
- Track AI usage where useful for cost and operational monitoring.
- Define allowed MCP tools and their permissions.
- Require approval for consequential actions such as sending messages, modifying financial records, or changing client data.
- Store credentials in server-side secret management.

**Security rules**

- Do not expose provider keys in the browser.
- Do not give AI unrestricted database or administrative access.
- Treat external content and model output as untrusted.
- Require human confirmation for consequential operations.
- Do not deploy an MCP server publicly unless there is a clearly defined requirement and a reviewed security design.

**Completion gate**

- AI features have defined permissions and usage limits.
- Failure cases are handled safely.
- MCP integrations use least-privilege access.
- Consequential actions cannot bypass required authorization or approval.

### Phase 12 — Testing and Quality Assurance

**Objectives**
Verify application behavior before production.

**Tasks**

- Add unit tests for business logic.
- Add API tests for validation and permissions.
- Add integration tests for database workflows.
- Test authentication and session behavior.
- Test client data isolation.
- Test contact submissions and notification failures.
- Test invoice calculations and payment webhooks.
- Run frontend linting, type checking, and production builds using available scripts.
- Review accessibility, responsive layouts, and SEO.
- Fix regressions before deployment.

**Completion gate**

- Critical user journeys pass.
- Security-sensitive cases have tests.
- No unresolved critical defects remain.
- Test results and known limitations are documented.

### Phase 13 — Production Deployment

**Objectives**
Deploy the application using compatible hosting and secure configuration.

**Tasks**

- Deploy the frontend to a compatible Next.js host.
- Deploy the Express API to a suitable Node.js runtime.
- Configure MongoDB Atlas production access.
- Set production environment variables.
- Configure trusted origins, HTTPS, authentication callbacks, and cookies.
- Configure email and payment webhooks where applicable.
- Enable suitable logging, monitoring, and backups.
- Test production workflows before public launch.

**Completion gate**

- Production frontend and backend are reachable.
- Authentication and database access work in the deployed environment.
- Critical workflows pass production smoke tests.
- Backup and recovery expectations are documented.

## 4. Definition of Done

A feature is considered complete only when:

- [ ] Requirements and acceptance criteria are satisfied.
- [ ] Code follows the established architecture.
- [ ] Inputs are validated at the appropriate boundaries.
- [ ] Authentication and authorization are enforced where required.
- [ ] Loading, empty, success, and error states are handled.
- [ ] Relevant tests have been executed.
- [ ] No secrets or sensitive data have been exposed.
- [ ] Responsive behavior has been verified.
- [ ] Documentation has been updated when necessary.
- [ ] The feature has been reviewed and its limitations documented.

## 5. Git and Change Management

Use small, descriptive commits after verifying a logical unit of work.

Example commit messages:

```text
chore: initialize application configuration
feat: build responsive agency homepage
feat: add public services API
feat: implement inquiry management
feat: add client project portal
test: cover invoice authorization
fix: prevent duplicate payment webhook processing
docs: update deployment instructions
```

Never force-push, delete branches, discard user changes, or perform destructive repository operations without understanding the impact and obtaining approval when needed.

## 6. OpenCode Execution Protocol

For every implementation task, OpenCode should:

1. State the task objective and acceptance criteria.
2. Inspect the relevant files before editing.
3. List the planned changes briefly.
4. Implement only the agreed scope.
5. Run the relevant available checks.
6. Fix issues introduced by its changes.
7. Summarize changed files and explain important decisions.
8. Report actual test results without claiming unexecuted checks passed.
9. Identify blockers and ask for approval when a consequential decision is required.
10. Stop at the phase completion gate when a required dependency, credential, or verification is missing.

Do not attempt to implement the entire platform in one large generation step. Build incrementally and verify each phase.

## 7. Current Development State

At the start of each session, inspect the repository to determine:

- Which phases are already implemented.
- Which features are incomplete.
- Which tests are passing or failing.
- Which credentials or external integrations are still required.
- Which architectural decisions remain unresolved.

Maintain a concise implementation checklist in the project documentation or a dedicated progress file if one exists. Do not assume that a feature is complete merely because its files exist.

## 8. Final Principle

**Build in small steps. Verify every important change. Protect client data. Keep the architecture understandable.**

Growers Journy should evolve into a reliable, maintainable agency platform—not just a visually impressive website.
