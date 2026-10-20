# Authentication & Security Guide — Growers Journy

## 1. Purpose

This document defines the authentication, authorization, application security, and data protection requirements for the Growers Journy platform.

The application must protect agency operations, client information, project records, invoices, and integrations against unauthorized access and misuse.

**Project:** Growers Journy  
**Frontend:** Next.js App Router, React, TypeScript  
**Backend:** Node.js, Express.js, TypeScript  
**Database:** MongoDB Atlas with Mongoose  
**Authentication:** Better Auth, subject to compatibility verification

Security must be implemented from the beginning, not added only before deployment.

## 2. Core Security Principles

Follow these principles throughout development:

1. **Least privilege:** Give each user only the permissions necessary for their work.
2. **Server-side enforcement:** Never rely on frontend checks as the only security control.
3. **Deny by default:** Protected operations must reject requests unless authorization is established.
4. **Data isolation:** Clients must never access another client's private records.
5. **Secure defaults:** Use restrictive configuration unless a requirement justifies otherwise.
6. **Defense in depth:** Use validation, authentication, authorization, rate limiting, and monitoring together.
7. **Secret protection:** Never expose credentials in browser code, Git, or ordinary logs.
8. **Auditable actions:** Record important administrative and financial changes.
9. **Minimal data collection:** Store and expose only information necessary for the feature.
10. **Verified behavior:** Test both authorized and unauthorized access paths.

## 3. Authentication and Authorization

Authentication determines the identity of a user. Authorization determines which operations that user is allowed to perform.

Both checks must be applied to protected backend operations.

### Supported roles

Use these application roles:

- `ADMIN`
- `TEAM_MEMBER`
- `CLIENT`

Do not assume that every team member has administrator privileges.

### Permission overview

| Capability                   | Admin                                 | Team Member                       | Client                                  |
| ---------------------------- | ------------------------------------- | --------------------------------- | --------------------------------------- |
| Manage agency-wide settings  | Yes                                   | Only if explicitly permitted      | No                                      |
| Manage inquiries             | Yes                                   | If authorized                     | No                                      |
| Manage clients               | Yes                                   | If authorized                     | No                                      |
| Manage projects              | Yes                                   | Within assigned permissions       | Only authorized project access          |
| View invoices                | Authorized agency access              | If explicitly permitted           | Own authorized invoices                 |
| Manage payment records       | Restricted administrative permissions | Only if explicitly permitted      | No direct financial record modification |
| Manage user roles            | Restricted administrative operation   | No by default                     | No                                      |
| Access internal AI/MCP tools | Only through approved permissions     | Only through approved permissions | No by default                           |

Implement these permissions explicitly. This table defines intended defaults, not a substitute for endpoint-level authorization.

## 4. Better Auth Integration Requirements

Better Auth is the preferred authentication option, but the selected version and database adapter must be compatible with the final architecture.

Before implementing it:

1. Inspect the installed Better Auth version.
2. Verify supported database adapters and persistence requirements.
3. Decide where authentication endpoints and session validation will run.
4. Define how Express will verify authenticated requests.
5. Confirm secure cookie behavior across frontend and backend domains.
6. Verify the documented integration with Next.js and the chosen backend architecture.
7. Write integration tests before exposing protected production routes.

Do not assume Better Auth automatically integrates with arbitrary Mongoose models or secures a separate Express API.

If the selected database or integration is unsupported, stop and propose a compatible architecture before implementing a workaround.

### Implemented integration (Task 06)

The following arrangement was verified against the installed versions and is the current implementation. It supersedes the earlier "planned" wording for this phase.

| Question | Answer |
| --- | --- |
| Where does Better Auth run? | In the **Express server** (`server/auth/create-auth.js`). Next.js does not create or validate sessions. |
| How does Express validate a session? | `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })` for every protected request, via `server/middleware/auth.js`. It is a database-backed lookup, so logout and expiry take effect immediately. |
| Which adapter? | `@better-auth/mongo-adapter` (official MongoDB driver adapter) with six collections: `user`, `session`, `account`, `verification`, plus optional `rateLimit`/`jwks` rows if those features are enabled. It receives the `Db` from the existing Mongoose connection, so there is one pool. |
| How is the cookie shared safely? | The browser calls same-origin `/api/auth/*` on the Next.js site. `client/next.config.ts` rewrites that path to Express. The cookie is host-only on the site origin, `Path=/`, and is never placed in browser storage. |
| What are the cookie and CSRF settings? | `HttpOnly`, `SameSite=Lax`, `Secure` (and the `__Secure-` prefix) whenever the public auth URL is HTTPS, `Path=/`, prefix `gj`. Better Auth's Origin + Fetch-Metadata CSRF checks stay enabled; `requireTrustedOrigin` is provided for future API writes. |
| Which origins are trusted? | Exactly the origins in `FRONTEND_URL` (comma-separated). No wildcard. |
| How is the first administrator created? | `npm run create-admin` in `server/`, using `auth.api.createUser` with the role hard-coded to `ADMIN`. It requires server-side environment variables and refuses to add a second admin unless `ALLOW_ADDITIONAL_ADMIN=true`. |

Roles are stored as the exact strings `ADMIN`, `TEAM_MEMBER`, and `CLIENT` in Better Auth's admin-plugin `role` field. Unknown or missing roles are denied, never defaulted. The admin plugin marks the role field `input: false`, so the public profile update endpoint cannot set it; a direct test confirms a `CLIENT` update with `role: "ADMIN"` is rejected with `FIELD_NOT_ALLOWED`. The admin plugin's `/admin/set-role` endpoint returns `403` for a client session.

The admin area accepts `ADMIN` only in Task 07; the portal accepts `CLIENT` only. A `TEAM_MEMBER` session is denied `/admin` and every `/api/v1/admin/*` endpoint. Staff do **not** receive implicit portal access, and `assertResourceOwner` does not grant staff implicit ownership of client records. A future support-access feature must add an explicit, audited membership check.

Task 07's `/api/v1/admin/*` router applies `requireAuth` → `requireRole(ADMIN)` → `requireTrustedOrigin` to every management route, then sets `Cache-Control: private, no-store`. The browser calls same-origin `/api/v1/admin/*` through a Next rewrite; the Next server forwards the HttpOnly cookie to Express for page reads. A page guard is never treated as the security boundary. Request bodies and query objects are strict Zod schemas, so client-supplied roles, ownership fields, internal fields, unknown sort keys, and malformed ids are rejected rather than forwarded to Mongoose.

Protected endpoints implemented in this phase:

| Full path | Access | Purpose |
| --- | --- | --- |
| `GET /api/v1/auth/me` | Authenticated | Safe profile: id, email, name, role, session expiry. Never a token or password. |
| `GET /api/v1/admin/access` | ADMIN | Proves the admin role check. |
| `GET /api/v1/portal/access` | CLIENT | Proves the client role check and denies staff. |

Public routes (`/api/v1/health`, `/api/v1/health/ready`, `POST /api/v1/inquiries`, `GET /`) remain unauthenticated.

**Not implemented in this phase:** password reset/recovery (requires email delivery, which is out of scope), email verification, client/team invitation UI, and any dashboard, project, or invoice feature. There is no public sign-up endpoint (`emailAndPassword.disableSignUp: true`).

**Residual risks and unverified items:**

- Better Auth's sign-in and `get-session` JSON include the session token even though the cookie is `HttpOnly`. Same-origin JavaScript can still call `/api/auth/get-session`. The mitigation is that no code stores or uses that token, and the app ships no third-party scripts; a strict CSP was not added in this phase because Next's inline bootstrap scripts require a nonce setup. Treat any XSS on the auth origin as session-compromising.
- Production `Secure`/`__Secure-` cookie behavior was verified by inspecting the `Set-Cookie` header from a config with `useSecureCookies: true`; it was not verified in a real HTTPS deployment.
- Real MongoDB persistence and `create-admin` against Atlas remain unverified in this environment because no `MONGODB_URI` is configured locally.
- Browser interaction, screen-reader output, and visual regression were not automated; there is no client test runner or browser automation installed.

## 5. Session Security

Use the authentication library's supported session-management mechanisms.

Requirements:

- Use HTTPS in production.
- Use secure cookie settings appropriate to the deployment.
- Enable `HttpOnly` for session cookies where applicable.
- Set an appropriate `SameSite` policy.
- Scope cookies to the narrowest appropriate domain and path.
- Apply sensible session expiration and renewal policies.
- Invalidate sessions during logout as supported by the implementation.
- Verify session expiration and revocation behavior.
- Avoid storing long-lived session credentials in browser-accessible storage.
- Never log session tokens or cookie values.

Do not invent custom cryptography or a custom session system when a supported authentication-library feature is available.

## 6. Secure User Provisioning

### Initial administrator

The first administrator must be provisioned through a controlled, documented process.

Acceptable approaches may include a protected administrative provisioning script or a restricted server-side operation.

Requirements:

- Verify the intended administrator identity.
- Use a secure initial credential or invitation workflow.
- Do not expose administrator provisioning publicly.
- Do not hardcode credentials in source code.
- Do not allow users to select `ADMIN` during public registration.
- Remove temporary provisioning access after setup.
- Audit important privilege changes.

### Client accounts

Client accounts should be created through an approved registration, invitation, or onboarding workflow.

A client must not gain access to a project simply by changing a URL or submitting a different user ID.

### Team accounts

Team access must be granted by an authorized administrator. Enforce the permissions assigned to the team member rather than assuming all team accounts are trusted.

## 7. Server-Side Authorization

Every protected API endpoint must enforce its access policy.

For each request:

1. Authenticate the caller.
2. Determine the trusted user identity and role.
3. Check permission for the requested operation.
4. Check resource ownership or membership when applicable.
5. Validate the request payload.
6. Execute the authorized operation.
7. Return only the data the caller is allowed to access.

Do not trust user identity, role, ownership, or permission values supplied by the browser.

### Client data isolation

For project, milestone, document, invoice, and update endpoints:

- Resolve the resource using trusted database records.
- Verify the authenticated client's project membership or ownership.
- Restrict database queries to authorized records when practical.
- Enforce authorization on reads and writes.
- Return appropriate error responses without revealing private resource details.
- Test cross-client access attempts.

A frontend route guard is useful for navigation but is not an authorization boundary.

## 8. API Security

Apply these protections to the Express API.

### Input validation

- Validate request bodies, path parameters, and query parameters.
- Use a schema validation library such as Zod where appropriate.
- Reject unexpected or invalid fields for sensitive operations.
- Enforce string-length, numeric-range, and allowed-value limits.
- Normalize data carefully without changing its intended meaning.
- Never pass untrusted objects directly into unrestricted database updates.

### HTTP and browser protections

- Configure security headers.
- Configure CORS with explicitly allowed origins.
- Use a consistent error-response format.
- Apply appropriate request body size limits.
- Use HTTPS in production.
- Apply rate limiting to authentication, contact, and other abuse-prone endpoints.
- Prevent sensitive internal errors from reaching clients.

CORS is not authentication and must not be used as the sole protection for an API.

### HTTP status codes

Use appropriate status codes, such as:

- `400` — Invalid request.
- `401` — Authentication required or invalid.
- `403` — Authenticated caller lacks permission.
- `404` — Resource not found or intentionally concealed.
- `409` — Conflict or invalid state transition.
- `422` — Semantically invalid input, if adopted by the API convention.
- `429` — Rate limit exceeded.
- `500` — Unexpected server error.

Keep status-code and error-body conventions consistent with `API.md`.

## 9. MongoDB and Mongoose Security

Requirements:

- Keep the MongoDB connection string server-side.
- Use a dedicated database user with minimum required permissions.
- Configure appropriate Atlas network access.
- Use Mongoose schemas and explicit validation.
- Avoid unrestricted object updates from request bodies.
- Prevent query injection by validating input and controlling query construction.
- Use indexes that support authorization and ownership queries.
- Avoid exposing internal fields or authentication records in API responses.
- Use safe serialization and response DTOs where appropriate.
- Back up important production data and document recovery procedures.

Do not store passwords in custom user fields when authentication is handled by Better Auth.

Authentication-specific records should follow the supported adapter's schema and persistence requirements.

## 10. Contact Form and Spam Protection

Public inquiry forms are potential targets for spam and automated abuse.

Implement:

- Server-side validation.
- Maximum field lengths.
- Rate limiting.
- Reasonable request size limits.
- Spam protection appropriate to the application's needs.
- Safe error handling.
- Optional email verification or additional verification where justified.

Escape or safely render user-provided content in the administrative interface.

Never assume a field is safe because it was submitted by the application's own frontend.

## 11. File and Document Security

If project documents or file uploads are implemented:

- Restrict file types and file sizes.
- Verify content rather than trusting filename extensions alone.
- Generate safe storage identifiers.
- Avoid executable upload locations.
- Do not expose private files through unrestricted public URLs.
- Verify the caller's access before issuing a download.
- Use short-lived signed links when supported and appropriate.
- Scan uploads when required by the risk profile.
- Avoid storing unnecessary sensitive information.

If document uploads are not yet required, do not introduce file-storage complexity prematurely.

## 12. Invoice and Payment Security

Financial records require strict authorization and integrity controls.

### Invoice integrity

- Calculate invoice totals on the server.
- Validate line items, amounts, currency, and state transitions.
- Restrict modifications after issuance according to the defined business rules.
- Record important financial changes.
- Do not permit clients to edit authoritative invoice totals or payment states.

### Payment processing

- Keep provider credentials server-side.
- Verify webhook signatures using the provider's supported procedure.
- Validate event types and associated identifiers.
- Process events idempotently.
- Prevent replay or duplicate processing where applicable.
- Reconcile verified payment events with the correct invoice.
- Store sufficient provider references for reconciliation without unnecessarily storing sensitive payment data.

Never mark an invoice as paid solely because the browser redirects to a success page.

Use the selected payment provider's current documentation before implementing its integration.

## 13. AI and MCP Security

AI integrations and MCP tools must use explicit permissions and narrow access boundaries.

Requirements:

- Keep provider keys and MCP credentials server-side.
- Validate and constrain AI inputs.
- Treat model output and retrieved external content as untrusted.
- Prevent model-generated text from becoming executable instructions without validation.
- Do not give models unrestricted database access.
- Restrict tools to the minimum permissions required.
- Separate read-only tools from tools that modify data.
- Require approval for consequential operations.
- Apply usage limits and cost controls.
- Avoid sending unnecessary client, financial, or confidential data to external providers.
- Log relevant operations without recording secrets.

MCP tools must not bypass ordinary application authentication or authorization.

Do not expose an internal MCP server publicly without a documented use case and security review.

## 14. Secrets and Environment Variables

Keep sensitive configuration in local environment files or an appropriate production secret manager.

Potential secret categories include:

- Database credentials.
- Authentication secrets.
- Email provider credentials.
- Payment provider keys and webhook secrets.
- AI provider keys.
- External integration credentials.

Rules:

- Never commit real secrets.
- Never include secrets in frontend environment variables.
- Never print full credentials in logs.
- Use separate development and production credentials.
- Rotate exposed credentials.
- Validate required environment variables at startup.
- Use placeholder values in `.env.example`.

## 15. Logging and Audit Trails

Maintain useful operational logs while protecting privacy.

Record relevant events such as:

- Administrator role changes.
- Inquiry status changes.
- Client and project permission changes.
- Invoice issuance and voiding.
- Verified payment processing events.
- Sensitive settings changes.
- Approved consequential AI or MCP operations.

Where appropriate, record:

- Actor identity.
- Action type.
- Affected resource identifier.
- Timestamp.
- Outcome.
- Relevant request or correlation identifier.

Do not store passwords, authentication tokens, complete session cookies, payment secrets, or unnecessary personal information in audit logs.

Protect audit records against unauthorized modification.

## 16. Error Handling and Security Responses

Security errors must not expose internal implementation details.

- Do not return stack traces to production clients.
- Avoid revealing private resource information.
- Log relevant technical context securely.
- Use generic authentication failure messages where appropriate.
- Handle rate limiting consistently.
- Ensure error handling does not bypass cleanup or authorization checks.
- Avoid leaking secrets through exception messages.

Detailed debugging information belongs in appropriately protected server-side logs.

## 17. Security Testing Checklist

Test these cases during development and before production.

### Authentication

- [ ] Unauthenticated requests cannot access protected endpoints.
- [ ] Invalid or expired sessions are rejected.
- [ ] Logout invalidates the relevant session.
- [ ] Password reset or account recovery follows the supported secure flow, if implemented.

### Authorization

- [ ] Clients cannot access other clients' projects.
- [ ] Clients cannot access other clients' invoices or documents.
- [ ] Team members cannot perform unauthorized administrative actions.
- [ ] Public registration cannot grant administrator privileges.
- [ ] Direct API calls cannot bypass frontend restrictions.

### API and database

- [ ] Invalid payloads are rejected.
- [ ] Unexpected fields cannot modify protected data.
- [ ] Rate limits work on abuse-prone endpoints.
- [ ] Database credentials remain private.
- [ ] Error responses do not expose stack traces or sensitive records.

### Payments and integrations

- [ ] Invalid webhook signatures are rejected.
- [ ] Duplicate payment events do not create duplicate records.
- [ ] Client input cannot mark an invoice as paid.
- [ ] AI and MCP tools cannot bypass application permissions.
- [ ] Provider failures are handled without corrupting business records.

### Deployment

- [ ] HTTPS is enabled.
- [ ] Production origins and cookie settings are verified.
- [ ] Environment variables are configured securely.
- [ ] Database access is restricted appropriately.
- [ ] Backups and incident-response procedures are documented.

## 18. Incident Response

If a credential or sensitive record is accidentally exposed:

1. Stop the exposure where possible.
2. Revoke or rotate the affected credentials.
3. Determine the scope and duration of exposure.
4. Inspect relevant logs and access records.
5. Restore safe configuration.
6. Assess whether affected users or service providers must be notified.
7. Document the incident and preventive changes.

Do not conceal a security incident or claim that data is safe without sufficient evidence.

## 19. OpenCode Security Instructions

Before implementing an authentication or security feature, OpenCode must:

1. Read `AGENTS.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, and this document.
2. Inspect the current authentication and authorization implementation.
3. Identify trust boundaries and potential bypasses.
4. Explain the proposed changes and relevant risks.
5. Use documented library integrations rather than inventing security mechanisms.
6. Implement server-side authorization and appropriate tests.
7. Run the available relevant checks.
8. Report any unverified behavior, missing credentials, or unresolved security concern.

Do not disable security controls to make a test pass. Do not claim a security audit has been completed when only limited checks have been run.

## 20. Definition of Done

Authentication or security work is complete only when:

- [ ] The required access policy is documented.
- [ ] Authentication and authorization are enforced at the appropriate boundaries.
- [ ] Data ownership and role permissions are verified.
- [ ] Inputs and errors are handled safely.
- [ ] Relevant negative tests have been executed.
- [ ] Secrets remain server-side.
- [ ] Sensitive actions are auditable where required.
- [ ] Documentation reflects the implemented behavior.
- [ ] Known risks and limitations are reported.

**Final principle:** Protect identities, enforce permissions on the server, isolate client data, and verify every security-sensitive workflow before production.
