# Testing & Quality Assurance (QA) — Growers Journy

## 1. Purpose

This document defines the testing and quality assurance standards for the Growers Journy agency website and management platform.

The platform includes:

- Public agency website.
- Dynamic services and portfolio.
- Contact form and lead management.
- Admin dashboard.
- Client portal.
- Team member access.
- Project and milestone management.
- Invoice and payment workflows.
- Email notifications.
- AI integrations and optional MCP tools.

The goal is to build a reliable, secure, responsive, accessible, and maintainable application.

**Core rule:** Never claim that a feature works until the relevant checks have actually been executed and their results verified.

## 2. QA Principles

1. Inspect the existing codebase before creating tests.
2. Test each feature as it is implemented.
3. Prefer small, focused tests over large, difficult-to-debug test suites.
4. Test expected behavior and failure scenarios.
5. Verify authorization on the backend.
6. Never use real payment transactions or production client data in routine tests.
7. Do not disable failing tests merely to achieve a passing result.
8. Do not modify unrelated application code while fixing a test.
9. Use the project's existing tools when they are appropriate.
10. Document untested areas, blockers, and known limitations honestly.

## 3. Testing Strategy

Use a layered testing strategy.

| Test level               | Purpose                            | Examples                           |
| ------------------------ | ---------------------------------- | ---------------------------------- |
| Unit testing             | Verify individual functions        | Invoice calculations, validators   |
| Component testing        | Verify UI components               | Contact form validation, dialogs   |
| API testing              | Verify backend endpoints           | Inquiry creation, project updates  |
| Integration testing      | Verify connected services          | Express + MongoDB, API + auth      |
| End-to-end testing       | Verify complete user journeys      | Client login and project viewing   |
| Security testing         | Verify access controls             | Cross-client data isolation        |
| Responsive testing       | Verify layouts across devices      | Mobile navigation and dashboard    |
| Accessibility testing    | Verify usability for diverse users | Keyboard navigation and labels     |
| Production smoke testing | Verify deployed critical paths     | Homepage, API health, contact flow |

Choose testing tools based on the current project setup and compatibility. Do not install multiple overlapping testing frameworks without a clear need.

## 4. Recommended Testing Tools

Inspect the repository before selecting or installing tools.

Potential choices:

- **Vitest or Jest:** Unit and integration tests.
- **React Testing Library:** React component behavior.
- **Supertest:** Express API testing.
- **Playwright:** Browser-based end-to-end testing.
- **ESLint:** Code quality and linting.
- **TypeScript compiler:** Type checking.
- **axe-core or an equivalent tool:** Automated accessibility checks.

These are recommendations, not mandatory dependencies. Prefer the toolchain already configured in the repository when suitable.

**What is actually installed (check `package.json` before relying on any of the above):** the backend uses Node's built-in `node --test` runner with `node:assert/strict` and the global `fetch` — no Jest, Vitest, or Supertest is installed. The frontend has ESLint and `tsc --noEmit`, and no test runner at all. Installing a test framework is a deliberate decision, not a default; confirm before adding one.

## 5. Unit Testing

Test important business logic independently of the database, network, or UI.

### Required areas

- Form validation.
- Email and URL validation.
- Inquiry status transitions.
- Project status transitions.
- Invoice subtotal and total calculations.
- Payment balance calculations.
- Pagination and filtering helpers.
- Role and permission helpers.
- AI input validation.
- Data transformation utilities.

### Invoice calculation example

```ts
type InvoiceItem = {
  quantity: number;
  unitPrice: number;
};

export function calculateSubtotal(items: InvoiceItem[]) {
  return items.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );
}
```

Test at least:

- A normal invoice with multiple items.
- An empty item list, if allowed.
- Zero quantity and zero price according to business rules.
- Negative quantities or prices are rejected by validation.
- Decimal and rounding behavior.
- Invalid or non-finite numeric input is rejected before calculation.

The example is illustrative. Adapt currency precision, tax rules, and validation to the actual invoice requirements.

## 6. Frontend and Component Testing

Test components through their user-visible behavior rather than relying on implementation details.

### Contact form

Verify:

- Required fields are enforced.
- Invalid email addresses are rejected.
- Optional fields can be omitted.
- Validation errors are understandable.
- Submission displays a loading state.
- Duplicate submissions are prevented where appropriate.
- Successful submissions show a confirmation.
- API failures display a useful error.
- Form data is handled safely.

### Authentication UI

Verify:

- Login and logout behavior.
- Loading and error states.
- Expired session handling.
- Protected navigation behavior.
- Correct role-specific navigation.
- No privileged action is exposed as authorized merely because a button is visible.

### Admin and client dashboards

Verify:

- Loading, empty, and error states.
- Search and filtering behavior.
- Pagination where implemented.
- Form submission and update behavior.
- Dialog and confirmation behavior.
- Mobile navigation.
- Appropriate feedback after successful or failed operations.

Use accessible labels, semantic HTML, and stable selectors for browser tests.

## 7. Backend API Testing

Test each API endpoint against its documented contract in `API.md`.

For every endpoint, verify:

1. Successful requests.
2. Missing or invalid fields.
3. Malformed identifiers and query parameters.
4. Unauthenticated requests where authentication is required.
5. Authenticated users with insufficient permissions.
6. Nonexistent resources.
7. Database or dependency failures.
8. Expected status codes and response formats.
9. Rate limits where configured.
10. Protection against unauthorized data exposure.

### Example API test matrix

| Scenario                                 | Expected outcome                               |
| ---------------------------------------- | ---------------------------------------------- |
| Valid contact inquiry                    | Inquiry is saved and success response returned |
| Missing required field                   | Validation error                               |
| Invalid JSON or malformed input          | Controlled client error                        |
| Unauthenticated admin request            | Authentication failure                         |
| Client requests another client's invoice | Access denied without leaking data             |
| Unknown resource ID                      | Appropriate not-found response                 |
| Database unavailable                     | Controlled server error                        |
| Excessive repeated requests              | Rate limit applied where configured            |

Use a test database or isolated test collections. Never run destructive test cases against production data.

### Implemented backend coverage (Task 03)

`cd server && npm test` runs these files (70 tests, all passing at the time of writing):

| File                         | Covers                                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `health.test.js`             | liveness envelope at `/api/v1/health`, readiness `503` without a database, `GET /`, generated `x-request-id`, no `x-powered-by` |
| `not-found.test.js`          | JSON `404` envelope for unknown paths and wrong methods, and never an HTML page                                                |
| `errors.test.js`             | malformed JSON → `400 INVALID_JSON`, oversized body → `413`, unexpected error → generic `500` with no leaked message or stack, `HttpError` passthrough, rejected async handlers forwarded to the error handler, credentials redacted in the server log |
| `logging.test.js`            | logs contain no bodies, headers, cookies, or query strings; rejected bodies never logged; client-supplied `x-request-id` ignored; full path (with mount prefix) logged; logging can be disabled |
| `validation.test.js`         | `req.validated` population, unknown-key stripping, `400 VALIDATION_ERROR` field details, submitted values never echoed            |
| `redact.test.js`             | redacts MongoDB/URL credentials, `Bearer`/`Basic` values, `key=value` forms, JWTs; leaves ordinary text unchanged; truncates long text |
| `inquiries.test.js`          | `POST /api/v1/inquiries`: valid → `201` with a generic body, normalization, `NEW` forced server-side, no PII echoed; missing required fields; invalid email; unsafe/invalid URLs; over-long fields; internal fields (`status`, `notes`, `assignedTo`, `convertedClientId`) rejected; honeypot accepted and discarded; injected repository failure → generic `500` with credentials redacted in the log; `429` with `Retry-After`; oversized body → `413`; malformed JSON; CORS preflight and exposed retry header; unsupported method → JSON `404` |
| `inquiry-validation.test.js` | strict schema: email/URL normalization, blank optionals, service allowlist, length limits, unknown keys |
| `inquiry-model.test.js`      | offline Mongoose validation: collection name, timestamps, default `NEW`, email lower-casing, blank optionals, required fields, enums, limits |

These tests never open a MongoDB connection and never touch real data — they start the app on an ephemeral port. With Task 05 they also cover item 1 (a valid inquiry) and item 9 (the inquiry rate limit), using an injected repository. With Task 06 they cover item 4 (authentication), item 5 (authorization), and item 10 (unauthorized data exposure at the role and object-helper level), using Better Auth's official in-memory adapter and injected fake resources. Task 07 adds live admin API tests through injected repositories, so the admin endpoints are exercised without MongoDB.

Task 06 test files:

| File | Coverage |
| --- | --- |
| `auth.test.js` | public sign-up disabled; valid sign-in; safe `/auth/me`; wrong password vs unknown email (same generic error); missing/malformed/expired session; logout revocation; cross-site sign-in and sign-out CSRF; repeated failed sign-ins → `429`; unknown role fails closed; public health/inquiry routes stay public; session identity cannot be spoofed with headers |
| `auth-config.test.js` | passwords stored as salted scrypt hashes, never plaintext; fixed 7-day cookie with `HttpOnly`/`SameSite=Lax`/`Path=/`; production `Secure` + `__Secure-` cookie; unknown role rejected by `createUser`; default role is `CLIENT`; `createAuth` rejects missing DB, short secret, invalid URL, invalid rate-limit values |
| `authorization.test.js` | ADMIN/TEAM_MEMBER/CLIENT access matrix for `/admin/access` and `/portal/access` (Task 07: `TEAM_MEMBER` is denied `/admin`); all protected endpoints reject anonymous callers; client cannot spoof admin via headers or query; query-level scoping; Client A vs Client B object access → `404`; staff do not get implicit ownership; role helpers fail closed; safe user projection strips secrets; `requireRole` and `requireTrustedOrigin` unit behavior |

Task 07 test files:

| File | Coverage |
| --- | --- |
| `admin-api.test.js` | anonymous/`TEAM_MEMBER`/`CLIENT` denied and `ADMIN` allowed; missing/untrusted origin on writes; inquiry list pagination/filter validation and invalid ids; valid and invalid status transitions; unknown fields rejected; duplicate client email; client detail with linked projects; duplicate service slug, create, archive; portfolio unsafe URL, publication and featured rules; read-only project list/detail; repository failure → generic `500` with no internal detail |
| `admin-models.test.js` | Client normalization/defaults/status validation; Project required client and date-order validation; Service slug/defaults/bounded arrays; Portfolio sample default and image limit; URL normalization; empty update schemas; inquiry transition map and serializer field safety |

Task 08 test files:

| File | Coverage |
| --- | --- |
| `portal-api.test.js` | linked vs unlinked CLIENT, inactive client link, ADMIN/TEAM_MEMBER denial, dashboard scoping and internal-update exclusion, project list/detail/milestone/update ownership, forged `clientId` query rejection, malformed ids, generic `500` on repository failure |
| `project-workflow.test.js` | project creation with active clients, inactive/unknown client handling, date-order validation, status transitions and conflicts, client reassignment, milestone date bounds and transitions, internal vs client-visible updates, portal visibility, explicit portal link/unlink and duplicate/role/unknown errors, role denial |
| `project-models.test.js` | Project defaults/date order/link bounds, Milestone completion derivation and status enum, ProjectUpdate default visibility/author, Client link fields and sparse unique index |

Task 09 test files:

| File | Coverage |
| --- | --- |
| `finance-unit.test.js` | Integer minor-unit line and invoice totals, disabled tax/discount rejection, exact balances/formatting, derived `ISSUED`/`PARTIALLY_PAID`/`PAID`/`OVERDUE`, grace-day cutoff and overdue list boundary |
| `finance-models.test.js` | Invoice defaults/date order/safe-integer/refund rules and unique sparse number, payment safe integers/provider enum/refund bound, event and refund unique indexes, portal serialization excludes internal notes |
| `invoice-payment-api.test.js` | Admin invoice create/issue/detail/void authorization, server-calculated totals, draft concealment, portal payment-session ownership, overpay rejection, partial payment, refunds, void-with-payments conflict, cross-client `404`, invalid/mismatched webhook signatures and amounts, duplicate and concurrent webhook delivery crediting once |

Current result: **149/149 server tests pass** (`npm test` from `server/`). This includes the 70 tests from Tasks 03–05, 30 Task 06 tests, 19 Task 07 tests, 15 Task 08 tests, and 15 Task 09 tests.

What is **not** automated:

- The actual `Inquiry.create()` write to MongoDB. There is no test database and no in-memory MongoDB dependency. Verify it manually against a development database, never against production data.
- A real MongoDB connection, real Better Auth persistence, `scripts/create-admin.js`, and live project/milestone/update/portal-link/invoice/payment/refund writes against Atlas. Use a development database and verify the `clients`, `projects`, `milestones`, `projectupdates`, `invoices`, `invoice_counters`, `payments`, `payment_events`, `payment_refunds`, `audit_events`, and Better Auth collections manually.
- A real payment provider. The only automated payment flow is the in-process `FAKE` sandbox with in-memory repositories; no provider sandbox, merchant credential, settlement, or live webhook delivery was tested.
- Browser behaviour of the login form, cookie persistence through the Next rewrite, screen-reader announcements, and visual states. A live smoke test against `next start` + a memory-adapter Express server was run manually during Task 06; Task 08 browser interaction, responsive checks, and screen-reader checks were not run.
- Real HTTPS cookie behavior. `Secure`/`__Secure-` were verified by inspecting the `Set-Cookie` header from a `useSecureCookies: true` instance, not from an HTTPS deployment.

### Frontend contact form (manual)

The client has no test runner, so the form states are verified in a browser against a running API:

| Scenario                         | Expected                                                                 |
| -------------------------------- | ------------------------------------------------------------------------ |
| Valid submission                 | Button shows "Sending…", then a focused success panel; inputs cleared     |
| Double-click submit              | Exactly one network request                                              |
| Missing name/service/description | Inline field errors, focus moves to the first one, no request sent       |
| Server rejects a field           | The server's message appears under that field; input preserved           |
| API stopped / wrong base URL     | "Your enquiry was not sent" with the direct email and phone; input kept   |
| Sixth submission in 15 minutes   | Rate-limit message with the retry delay; input kept                       |
| Keyboard only                    | All fields, honeypot skipped, submit reachable, notices announced        |


## 8. Authentication and Authorization Testing

Authentication and authorization are high-priority security requirements.

Test the following roles:

- `ADMIN`
- `TEAM_MEMBER`
- `CLIENT`

Verify that:

- Unauthenticated users cannot access protected resources.
- Admin-only operations reject other roles.
- Team members can perform only their permitted actions.
- Clients can access only their own authorized resources.
- Changing an ID in a URL or request body does not bypass authorization.
- Users cannot assign themselves an admin role.
- Expired or invalid sessions are rejected.
- Logout and session invalidation behave as intended.
- Authentication cookies use appropriate security settings.
- Backend endpoints independently enforce authorization.

### Task 06 automated result

The server test suite runs without MongoDB by injecting Better Auth's official in-memory adapter. The role matrix currently enforced is:

| Caller | `/api/v1/admin/access` | `/api/v1/portal/access` |
| --- | --- | --- |
| Anonymous / invalid cookie | `401 UNAUTHENTICATED` | `401 UNAUTHENTICATED` |
| `ADMIN` | `200` | `403 FORBIDDEN` |
| `TEAM_MEMBER` | `200` | `403 FORBIDDEN` |
| `CLIENT` | `403 FORBIDDEN` | `200` |
| Unknown role in DB | `403 FORBIDDEN` | `403 FORBIDDEN` |

Additional verified behaviour:

- A cookie from one client cannot be turned into another identity with `x-user-id`, `x-user-role`, or query parameters.
- Logout deletes the session row; the old cookie gets `401`.
- Moving a stored session's `expiresAt` into the past gets `401`.
- A sign-in or sign-out with a foreign `Origin` gets `403 INVALID_ORIGIN`.
- Repeated failed sign-ins get `429`, including a later correct password while the bucket is exhausted.
- Passwords are salted scrypt hashes in `account.password`; the `user` row has no password field.
- A default-role user is `CLIENT`, never `ADMIN`.

The object-level pattern is unit-tested with fake project/invoice records. It is not yet wired to real project or invoice routes, because those features are out of scope. When they are added, every query must include `ownedByQuery(req.auth.user)` and every loaded record must pass `assertResourceOwner(...)`.

### Object-level authorization

Create two test clients with separate projects and invoices.

Attempt to access Client B's records using Client A's authenticated session.

**Expected result:** Access is denied, and no private information is returned.

Repeat this test for every resource type that contains client-specific information, including documents, milestones, tasks, updates, and invoices where applicable.

## 9. Database and Integration Testing

Verify interactions among Express, Mongoose, MongoDB Atlas or an isolated test database, and the other configured integrations.

Test:

- Successful database connection.
- Missing or invalid connection configuration.
- Schema validation.
- Required fields.
- Unique indexes and duplicate-key handling.
- Query filtering and pagination.
- Safe handling of malformed identifiers.
- Database errors and connection failures.
- Persistence across requests.
- Correct ownership and relationships between records.

For integration tests, use a controlled test environment with cleanup procedures.

Avoid brittle tests that depend on the order in which tests execute or on pre-existing production records.

## 10. Email, Payment, AI, and MCP Testing

### Email

Verify:

- Correct notification content.
- Provider errors are handled.
- Inquiry records remain available if email delivery fails.
- Retry mechanisms do not create duplicate inquiries.
- Email credentials are never exposed to the frontend.

Do not treat an API acceptance response as proof that the recipient received the email.

### Payments

Verify:

- Invoice amounts are calculated server-side.
- Invalid webhook signatures are rejected.
- Duplicate webhook events do not duplicate payments.
- Pending payments do not become paid prematurely.
- Failed and refunded transactions are represented correctly.
- Payment status cannot be changed by an ordinary client request.
- Provider sandbox results are handled correctly.

Task 09 automated coverage: the finance unit/model suites plus `invoice-payment-api.test.js` cover totals, statuses, validators, authorization, draft concealment, partial payments, refund bounds, cross-client access, invalid signatures, amount mismatches, and duplicate/concurrent delivery. The `FAKE` provider is test-only. A real provider sandbox must be added and verified separately before enabling live payments.

Never use real customer card data or production transactions in routine testing.

### AI

Verify:

- Valid and invalid input.
- Provider timeout and rate-limit responses.
- Usage limits and cost controls.
- Safe handling of untrusted model output.
- No secrets or unauthorized client information are exposed.
- Essential website functionality remains available if the AI provider fails.

### MCP

If application-level MCP is implemented, verify:

- Authentication and authorization of tool calls.
- Input validation.
- Least-privilege permissions.
- Rejection of unauthorized operations.
- Approval requirements for sensitive actions.
- Safe error handling and logging.

Development MCP tools configured in OpenCode must not be assumed to be application-level integrations.

## 11. End-to-End Testing

Use Playwright or an equivalent tool to test complete user journeys in a dedicated test environment.

### Public visitor journey

1. Open the homepage.
2. Navigate to services.
3. Browse portfolio projects.
4. Open a project details page.
5. Submit a valid contact inquiry.
6. Verify the resulting confirmation.

### Admin journey

1. Sign in as an authorized administrator.
2. Open the admin dashboard.
3. Review incoming inquiries.
4. Update an inquiry's status.
5. Create or update a project.
6. Verify the change persists after reloading.

### Client journey

1. Sign in as a test client.
2. Open the client portal.
3. View an authorized project.
4. Review milestones and updates.
5. View an authorized invoice.
6. Attempt to access another client's resource and verify access is denied.

### Team member journey

1. Sign in with a test team member account.
2. Open the permitted dashboard.
3. Perform an allowed operation.
4. Attempt a restricted operation.
5. Verify that the restricted operation is denied by the backend.

Keep test accounts and fixtures separate from real users.

## 12. Responsive UI Testing

Test the application at representative viewport widths, including:

- 320–375 px: narrow mobile.
- 390–430 px: common mobile sizes.
- 768 px: tablet.
- 1024 px: small desktop or landscape tablet.
- 1280 px and above: desktop.

Verify:

- No unintended horizontal overflow.
- Navigation remains usable.
- Forms and dialogs fit the viewport.
- Tables have an appropriate responsive strategy.
- Buttons have adequate touch targets.
- Text remains readable.
- Images scale correctly.
- Dashboard charts and data tables remain usable.
- Mobile menus can be opened and closed.
- Light and dark themes, if implemented, remain readable.

Test real browser behavior in addition to relying on CSS inspection.

## 13. Accessibility Testing

Follow practical WCAG-aligned accessibility practices.

Verify:

- Semantic page structure.
- Correct heading hierarchy.
- Accessible form labels.
- Clear validation feedback.
- Keyboard navigation.
- Visible focus indicators.
- Accessible names for interactive controls.
- Appropriate color contrast.
- Meaningful alternative text for informative images.
- Screen-reader-friendly status messages.
- Reduced-motion preferences where relevant.

Automated tools can identify many issues but cannot prove complete accessibility. Manually test important workflows with keyboard navigation.

## 14. Performance and Reliability Testing

Measure performance before optimizing.

Check:

- Production build success.
- Unnecessary client-side JavaScript.
- Excessive component re-rendering.
- Unoptimized images.
- Large bundles.
- Slow database queries.
- Missing indexes for important query patterns.
- Unbounded collection queries.
- Repeated network requests.
- API timeout behavior.
- Memory or connection issues under representative workloads.

Use Lighthouse, browser developer tools, or suitable profiling tools where available.

Do not introduce caching until invalidation, freshness, and authorization behavior are understood. Never serve one client's private cached data to another client.

## 15. Security QA Checklist

Before release, verify:

- [ ] Secrets are absent from source code and client bundles.
- [ ] Environment variables are validated.
- [ ] Backend authentication is enforced where required.
- [ ] Role-based authorization is enforced server-side.
- [ ] Object-level authorization prevents cross-client access.
- [ ] Input validation is implemented on the server.
- [ ] Database queries are protected against injection and unsafe operators.
- [ ] Contact endpoints have appropriate rate limits and spam prevention.
- [ ] CORS and cookie settings are correct for deployment.
- [ ] Sensitive data is excluded from logs and error responses.
- [ ] Upload validation exists if uploads are implemented.
- [ ] Payment webhook signatures are verified if payments are implemented.
- [ ] AI and MCP integrations follow least-privilege principles.
- [ ] Dependencies and build tooling are checked for relevant vulnerabilities.
- [ ] Authorization failures are tested, not merely assumed.

A checklist is not proof of security. Record the tests and evidence for important controls.

## 16. Quality Gates Before Merging

Before marking a feature complete, run the relevant available checks.

Typical checks include:

```bash
# Inspect package.json and use the actual available scripts.
npm run lint
npm run typecheck
npm run test
npm run build
```

These commands are examples. Script names vary by project, so inspect `package.json` and run the commands that actually exist.

If frontend and backend use separate package configurations, execute the relevant checks in each workspace.

### Concrete commands for this repository

```bash
cd client && npm run lint        # passes
cd client && npm run typecheck   # fails while route files are still empty placeholders
cd client && npm run build       # fails for the same reason
cd server && npm test            # node --test; passes (no database required)
```

`server/` has no linter configured. State honestly which commands were run, and report failures with the real reason rather than describing them as passing.

Do not hide failing checks, skip required validations without explanation, or report commands as passed if they were not executed.

### Release blockers

Do not release a feature with an unresolved critical issue involving:

- Unauthorized access to private data.
- Authentication or authorization bypass.
- Incorrect invoice or payment state.
- Exposed secrets.
- Destructive data corruption.
- Broken critical user journeys.
- A failed production build.

Document lower-priority known issues and obtain an appropriate decision before release.

## 17. Bug Reporting and Regression Testing

For each confirmed defect, document:

- Bug title.
- Environment and application version.
- Reproduction steps.
- Expected behavior.
- Actual behavior.
- Relevant logs or screenshots, excluding secrets and private data.
- Severity and impact.
- Root cause when known.
- Fix and verification results.

After fixing a defect:

1. Reproduce it before the fix when possible.
2. Identify the root cause.
3. Implement the smallest safe correction.
4. Add a regression test when appropriate.
5. Run the relevant test suite.
6. Verify related workflows have not regressed.

Do not claim a root cause without sufficient evidence.

## 18. Definition of Done

A feature passes QA only when:

- Its acceptance criteria are verified.
- Relevant tests have been executed.
- Validation and error states are tested.
- Authorization requirements are verified.
- No unresolved critical defect remains.
- Responsive and accessibility checks are completed where applicable.
- Relevant lint, type, and build checks pass.
- Documentation is updated.
- Test results and known limitations are reported honestly.

## 19. OpenCode Testing Prompt

Use the following prompt when testing or reviewing a feature:

> Read `PRD.md`, `API.md`, `Authentication & Security.md`, `Integration.md`, and `Testing & QA.md`. Inspect the existing repository and identify the actual testing tools, scripts, architecture, and feature acceptance criteria.
>
> Create a focused test plan for the selected feature. Prioritize business logic, API contracts, authentication, authorization, validation, failure handling, and regression risks.
>
> Implement or update tests using the project's existing compatible tools. Use isolated test data and appropriate provider sandboxes. Never run destructive tests against production data or perform real payment transactions.
>
> Execute the relevant tests, lint checks, type checks, and build commands that actually exist. Diagnose failures rather than suppressing them. Make minimal, focused fixes and rerun the affected tests.
>
> Report the checks executed, actual pass/fail results, files changed, unresolved issues, security concerns, and any testing limitations. Clearly distinguish verified behavior from assumptions. Never claim that a test passed unless it actually passed.

---
