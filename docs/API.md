# Growers Journy — REST API Specification

**Project:** Growers Journy  
**Backend:** Node.js + Express.js + TypeScript  
**Database:** MongoDB Atlas + Mongoose  
**API Style:** REST  
**API Version:** v1  
**Base Path:** `/api/v1`

---

## 1. Purpose

Define the API contract for the Growers Journy agency website and management platform.

The API supports:

- Public website content
- Contact inquiries and lead management
- Authentication and user profiles
- Admin dashboard
- Client management
- Project and milestone tracking
- Dynamic portfolio
- Services
- Invoices and payments
- Notifications
- AI-powered features
- Audit events and administrative actions

Implement endpoints incrementally. Do not create every endpoint before its feature is required.

---

## 2. API Design Principles

1. Use `/api/v1` for application endpoints.
2. Use appropriate HTTP methods and status codes.
3. Validate request bodies, query parameters, and path parameters.
4. Enforce authentication and authorization on the backend.
5. Apply object-level authorization to private resources.
6. Return consistent JSON responses.
7. Never expose passwords, session secrets, database credentials, or provider secrets.
8. Apply rate limits to sensitive and publicly accessible endpoints.
9. Use pagination for potentially large collections.
10. Document every implemented endpoint.
11. Keep controllers thin and business logic in service modules.
12. Use idempotency for operations where duplicate requests could cause financial or operational problems.

---

## 3. Base URL and Environment

Development example:

```text
http://localhost:4000/api/v1
```

Production example:

```text
https://api.example.com/api/v1
```

The production domain is a placeholder and must be replaced with the actual configured domain.

Frontend configuration:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
```

Do not place secret values in frontend environment variables.

---

## 4. Authentication and Authorization

### Authentication

Use Better Auth only after verifying the supported integration with the selected Next.js, Express.js, and MongoDB configuration.

The frontend and backend must share a clearly defined, trusted session-validation strategy.

Do not assume that the Express API is protected merely because the frontend has a login page.

### Roles

```text
ADMIN
TEAM_MEMBER
CLIENT
```

### Access definitions

- **Public:** No login required.
- **Authenticated:** Any active, authenticated user who meets endpoint requirements.
- **Admin:** Authorized administrator.
- **Team:** An authorized team member with the required permission.
- **Client:** An authenticated client who owns or is explicitly authorized to access the requested resource.

A route's role label is only a baseline. The backend must also check resource ownership, membership, and applicable business rules.

### Authorization rules

- Never trust a role submitted in the request body.
- Never trust a client-supplied `userId` to establish ownership.
- Never allow a client to retrieve another client's resources.
- Never expose private internal project updates through public endpoints.
- Never allow an ordinary user to promote themselves to administrator.
- Recheck permissions for every protected write operation.

---

## 5. Standard Response Format

### Successful response

```json
{
  "success": true,
  "data": {
    "id": "resource-id"
  }
}
```

### Paginated response

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

### Error response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted information.",
    "details": []
  }
}
```

Only include safe, useful validation details. Never expose stack traces, secrets, or internal infrastructure information in production responses.

**Implemented behavior (Task 03).** The envelope above is produced by `server/utils/api-response.js` (`sendSuccess` / `sendError`); every route and middleware uses it, so the shape is identical everywhere. Notes:

- `error.details` is included **only** when there is at least one entry, so a plain 404 or 500 body is `{ "success": false, "error": { "code": "...", "message": "..." } }`.
- The `paginated` shape is specified here but **not implemented** — no list endpoint exists yet.
- Every response carries an `x-request-id` header (server-generated, never taken from the client). The same id appears in the server request log and in server-side error logs, which is how a reported problem is traced without exposing internal details.
- Stack traces and internal error messages are **never** part of a response, in any environment. `NODE_ENV` defaults to `development`, so a "production-only" rule would have been meaningless.

---

## 6. HTTP Status Codes

| Status | Meaning                                         |
| ------ | ----------------------------------------------- |
| `200`  | Successful request                              |
| `201`  | Resource created                                |
| `202`  | Request accepted for asynchronous processing    |
| `204`  | Successful request with no response body        |
| `400`  | Invalid request                                 |
| `401`  | Authentication required or invalid              |
| `403`  | Insufficient permissions                        |
| `404`  | Resource not found or intentionally concealed   |
| `409`  | Resource conflict or duplicate operation        |
| `422`  | Semantically invalid data, if used consistently |
| `429`  | Rate limit exceeded                             |
| `500`  | Unexpected server error                         |
| `502`  | Invalid or failed upstream service response     |
| `503`  | Service temporarily unavailable                 |

Choose a consistent policy for `400` versus `422`; do not use them interchangeably without a documented reason.

### Implemented status codes and error codes (Task 03)

`400` is this project's choice for invalid input, including failed validation and malformed JSON; **`422` is not used**.

| Status | Error code            | When                                                                     |
| ------ | --------------------- | ------------------------------------------------------------------------ |
| `400`  | `VALIDATION_ERROR`    | Zod request validation failed (`details`: `[{ field, message }]`)         |
| `400`  | `INVALID_JSON`        | The request body is not valid JSON                                       |
| `404`  | `NOT_FOUND`           | Unmatched route, wrong method on a known path, or a missing resource     |
| `413`  | `PAYLOAD_TOO_LARGE`   | The request body exceeded the JSON limit                                 |
| `429`  | `RATE_LIMIT_EXCEEDED` | Rejected by the public inquiry rate limiter (see 7.6)                    |
| `500`  | `INTERNAL_ERROR`      | An unexpected server failure; the client only ever sees a generic message |
| `503`  | `DATABASE_UNAVAILABLE` | The readiness check could not reach MongoDB                             |

Rules that apply to every response:

- JSON request bodies are limited to **`100kb`** (`express.json({ limit })` in `server/app.js`). Requests over the limit are rejected with `413` before any route runs.
- Malformed JSON is answered with `400 INVALID_JSON`, never a framework error page.
- Unmatched routes always return the JSON `NOT_FOUND` envelope — including non-API paths such as `/nope` — so this server never replies with Express's default HTML page.
- Unexpected errors return the generic message `"Something went wrong."`; the original message and stack are logged server-side with the request id only.
- Validation `details` contain only a field path and the schema's message. The submitted value is never echoed back, so rejected input cannot leak back to the caller.
- CORS stays restricted to the origins in `FRONTEND_URL`; a disallowed `Origin` receives no `Access-Control-Allow-Origin` header.
- `x-powered-by` is disabled.

---

## 7. Public Website APIs

### 7.1 Health Check

| Property | Value                                                        |
| -------- | ------------------------------------------------------------ |
| Method   | `GET`                                                        |
| Endpoint | `/health`                                                    |
| Access   | Public or infrastructure-restricted, depending on deployment |

Purpose: Confirm that the backend is responding.

Example response:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

Do not expose credentials, connection strings, detailed internal configuration, or sensitive infrastructure information through the health endpoint.

A separate internal readiness check may verify database availability.

**Implemented readiness check:** `GET /api/v1/health/ready` reports database availability only. It returns `200` with `{ "success": true, "data": { "status": "ready", "database": "connected" } }` when the database answers a ping, and `503` with code `DATABASE_UNAVAILABLE` when it does not. It exposes no hostnames, connection strings, credentials, driver versions, or error details. `GET /health` remains a liveness check that does not touch the database.

### 7.2 List Services

| Property | Value       |
| -------- | ----------- |
| Method   | `GET`       |
| Endpoint | `/services` |
| Access   | Public      |

Optional query parameters:

- `page`
- `limit`

Rules:

- Return published services only.
- Validate pagination values.
- Use a stable sort order.
- Do not expose internal administrative fields.

### 7.3 Get Service Details

| Property | Value             |
| -------- | ----------------- |
| Method   | `GET`             |
| Endpoint | `/services/:slug` |
| Access   | Public            |

Return a published service matching the slug. Return `404` if the service is missing or unpublished.

### 7.4 List Portfolio Projects

| Property | Value        |
| -------- | ------------ |
| Method   | `GET`        |
| Endpoint | `/portfolio` |
| Access   | Public       |

Optional query parameters:

- `page`
- `limit`
- `category`
- `featured`

Rules:

- Return published projects only.
- Validate filter values.
- Limit the maximum page size.
- Do not expose confidential project information.

### 7.5 Get Portfolio Project

| Property | Value              |
| -------- | ------------------ |
| Method   | `GET`              |
| Endpoint | `/portfolio/:slug` |
| Access   | Public             |

Return a published portfolio case study.

### 7.6 Submit Inquiry

| Property | Value                |
| -------- | -------------------- |
| Method   | `POST`               |
| Endpoint | `/inquiries`         |
| Access   | Public, rate-limited |

Request example:

```json
{
  "name": "Example Person",
  "email": "person@example.com",
  "company": "Example Company",
  "service": "web-application-development",
  "projectDescription": "I need a responsive business application.",
  "budget": "To be discussed",
  "timeline": "Within three months",
  "referenceUrl": "example.com"
}
```

`service` must be one of `web-application-development`, `business-automation`,
`ai-integration`, or `not-sure` (shown as "Not sure yet" in the form).

| Field                | Required | Rules                                                                                                                          |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `name`               | yes      | 2–100 characters, trimmed                                                                                                      |
| `email`              | yes      | Valid address, trimmed, lower-cased, ≤254 characters                                                                           |
| `company`            | no       | ≤120 characters; an empty value is stored as absent                                                                            |
| `service`            | yes      | One of the four slugs above                                                                                                    |
| `projectDescription` | yes      | 20–5000 characters, trimmed                                                                                                    |
| `budget`             | no       | ≤100 characters                                                                                                                |
| `timeline`           | no       | ≤100 characters                                                                                                                |
| `referenceUrl`       | no       | ≤2048 characters; `http`/`https` only; a missing scheme becomes `https://`; embedded credentials are rejected                   |
| `website`            | no       | Honeypot. Declared so the strict schema does not reject a bot that fills it; a non-empty value still returns `201` and is discarded |

Unknown fields are **rejected** with `400`, not silently ignored. That includes
`status`, `notes`, `assignedTo`, `convertedClientId`, `_id`, and timestamps. The
initial status is always set to `NEW` on the server.

Success — `201 Created`:

```json
{
  "success": true,
  "data": { "message": "Thank you — your enquiry has been received." }
}
```

No id, email address, description, or status is returned.

Errors:

| Status | Code                  | Cause                                                                                                                  |
| ------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `400`  | `VALIDATION_ERROR`    | A field is missing, invalid, over-length, or unsupported. `details` is `[{ field, message }]`, e.g. `field: "body.email"` |
| `400`  | `INVALID_JSON`        | The request body is not valid JSON                                                                                     |
| `413`  | `PAYLOAD_TOO_LARGE`   | The body exceeds the `100kb` JSON limit                                                                                |
| `429`  | `RATE_LIMIT_EXCEEDED` | More than 5 submissions from one IP in 15 minutes; `Retry-After` is set                                                 |
| `500`  | `INTERNAL_ERROR`      | The database write (or another unexpected step) failed. The response is generic; details are logged server-side only    |

Rate limiting and abuse protection (implemented in Task 05):

- 5 requests per 15 minutes per client IP. Accepted and rejected submissions
  both count.
- `RateLimit`, `RateLimit-Policy`, and `Retry-After` are returned and are exposed
  through CORS so the browser form can read the retry delay.
- A hidden honeypot field plus rate limiting. No CAPTCHA. A determined bot can
  bypass a honeypot, so this is a deterrent — not authentication.
- Request bodies and submitted values are never logged.
- `TRUST_PROXY` must match the deployment: `false` when the API is reached
  directly, or a hop count when a known proxy forwards requests. A permissive
  `true` is rejected by configuration validation, because it would let any
  caller forge `X-Forwarded-For` and reset its own rate-limit bucket.

---

## 8. Authentication APIs

Authentication uses the installed Better Auth version (`better-auth@1.7.11`) with the official `@better-auth/mongo-adapter@1.7.11`. Custom password, session, and token endpoints are **not** implemented; Better Auth's documented endpoints own those flows.

### 8.1 Integration facts

- **Where it runs:** Better Auth runs in the Express server (`server/auth/create-auth.js`). Next.js never issues or validates a session.
- **Session validation:** Express calls `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })` on every protected request. The lookup is database-backed, so expiry and logout are immediate.
- **Browser path:** the browser calls same-origin `/api/auth/*`. `client/next.config.ts` rewrites that path to the Express auth handler. This keeps the host-only session cookie on the site origin and avoids a cross-domain cookie.
- **Adapter:** `mongodbAdapter(db, { client })`, using the `Db` and `MongoClient` from the existing Mongoose connection. `MONGODB_TRANSACTIONS` controls adapter transactions (default `true`; set `false` for a standalone local MongoDB).
- **Cookies:** `HttpOnly`, `SameSite=Lax`, `Path=/`, host-only, prefix `gj`. `Secure` and the `__Secure-` prefix are used when `BETTER_AUTH_URL` is HTTPS. The session is an absolute 7 days (`Max-Age=604800`) with refresh disabled and no cookie cache.
- **CSRF:** Better Auth's Origin + Fetch-Metadata checks stay enabled. A sign-in or sign-out with `Origin: https://evil.example` returns `403 INVALID_ORIGIN`. `requireTrustedOrigin` is exported for future state-changing API endpoints.
- **Rate limiting:** Better Auth limits `/sign-in/email` to 5 requests per 60 seconds per client IP by default. `express-rate-limit` continues to protect `POST /api/v1/inquiries`.
- **Trusted origins:** exactly the comma-separated origins in `FRONTEND_URL`. Wildcards are not used.
- **Provisioning:** `npm run create-admin` in `server/` calls `auth.api.createUser` with `role: ADMIN`. There is no public sign-up (`emailAndPassword.disableSignUp: true`), and the role field is not writable through the public profile API.
- **Roles:** `ADMIN`, `TEAM_MEMBER`, `CLIENT`. A missing or unknown role is denied, not defaulted.

### 8.2 Better Auth endpoints

These are implemented by Better Auth and are not duplicated by this project. Paths are relative to the site origin; Next rewrites them to Express.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/sign-in/email` | Email + password sign-in; sets the session cookie |
| `POST` | `/api/auth/sign-out` | Revokes the session and clears the cookie |
| `GET` | `/api/auth/get-session` | Better Auth session payload |
| `POST` | `/api/auth/sign-up/email` | Disabled; returns `EMAIL_PASSWORD_SIGN_UP_DISABLED` |

Sign-in and `get-session` responses include a session token in JSON. The application deliberately ignores it and never stores it. The browser session lives only in the `HttpOnly` cookie.

### 8.3 Get Current User

| Property | Value |
| --- | --- |
| Method | `GET` |
| Full endpoint | `/api/v1/auth/me` |
| Access | Authenticated |
| Success | `{ success: true, data: { user: { id, email, name, role }, session: { expiresAt } } }` |

Returns only the safe profile. It never returns the session token, password hash, account row, or provider data. A missing, malformed, expired, or revoked cookie returns `401 UNAUTHENTICATED`. A valid account with a missing/unknown role returns `403 FORBIDDEN`.

The Next.js protected layouts use this endpoint server-side, forwarding the browser cookie. They do not verify the session themselves.

### 8.4 Area access checks

| Property | Value |
| --- | --- |
| Methods | `GET` |
| Endpoints | `/api/v1/admin/access`, `/api/v1/portal/access` |
| Access | `ADMIN`/`TEAM_MEMBER` for admin; `CLIENT` for portal |

These endpoints exist to make the role boundary testable and to give future frontends one explicit check. They return `{ area, role }` on success and `403 FORBIDDEN` for the wrong role. Staff do not receive implicit portal access.

### 8.5 Update Current Profile

Not implemented in this phase. When it is added, allow only explicitly permitted fields such as a validated display name. Never accept role changes, ownership changes, or administrative permissions through a profile endpoint.

---

## 9. Admin Dashboard APIs

All endpoints under `/admin` require an authenticated administrator unless an explicit permission-based exception is documented.

### 9.0 Task 07 implementation status

The implemented admin API is mounted at `/api/v1/admin`. Every request is
re-authenticated with Better Auth on the Express side and requires the `ADMIN`
role. `TEAM_MEMBER` and `CLIENT` sessions receive `403 FORBIDDEN`; writes also
require a trusted `Origin`. Responses are `Cache-Control: private, no-store`.

| Method   | Endpoint                                  | Status in Task 07              |
| -------- | ----------------------------------------- | ------------------------------ |
| `GET`    | `/api/v1/admin/dashboard`                 | Implemented                    |
| `GET`    | `/api/v1/admin/inquiries`                 | Implemented                    |
| `GET`    | `/api/v1/admin/inquiries/:id`             | Implemented                    |
| `PATCH`  | `/api/v1/admin/inquiries/:id`             | Implemented (status only)      |
| `GET`    | `/api/v1/admin/clients`                   | Implemented                    |
| `POST`   | `/api/v1/admin/clients`                   | Implemented                    |
| `GET`    | `/api/v1/admin/clients/:id`               | Implemented                    |
| `PATCH`  | `/api/v1/admin/clients/:id`               | Implemented                    |
| `GET`    | `/api/v1/admin/projects`                  | Implemented (read-only)        |
| `GET`    | `/api/v1/admin/projects/:id`              | Implemented (read-only)        |
| `GET`    | `/api/v1/admin/services`                  | Implemented                    |
| `POST`   | `/api/v1/admin/services`                  | Implemented                    |
| `GET`    | `/api/v1/admin/services/:id`              | Implemented                    |
| `PATCH`  | `/api/v1/admin/services/:id`              | Implemented                    |
| `DELETE` | `/api/v1/admin/services/:id`              | Implemented (archive)          |
| `GET`    | `/api/v1/admin/portfolio`                 | Implemented                    |
| `POST`   | `/api/v1/admin/portfolio`                 | Implemented                    |
| `GET`    | `/api/v1/admin/portfolio/:id`             | Implemented                    |
| `PATCH`  | `/api/v1/admin/portfolio/:id`             | Implemented                    |
| `DELETE` | `/api/v1/admin/portfolio/:id`             | Implemented (archive)          |

List endpoints accept `page` (default 1) and `limit` (default 20, maximum 100)
and return `{ success, data: { items }, pagination }`. Query objects are strict
Zod objects: unknown filters, invalid statuses, invalid sort fields, and
malformed ObjectIds return `400 VALIDATION_ERROR`. Search is a literal,
case-insensitive contains match with regex metacharacters escaped.

Inquiry status transitions implemented in Task 07:

- `NEW` → `REVIEWING` or `CLOSED`
- `REVIEWING` → `QUALIFIED` or `CLOSED`
- `QUALIFIED` → `CONVERTED` or `CLOSED`
- `CONVERTED` → `CLOSED`
- `CLOSED` is terminal

Any other transition returns `409 INVALID_STATUS_TRANSITION`. If another admin
changes the status first, the conditional write returns `409 STATUS_CHANGED`
instead of overwriting the newer state. `CONVERTED` is a label only; it does not
create a client or a project. Inquiry deletion, assignment, notes, and conversion
workflows are **not implemented**.

Clients use a unique lowercase `primaryEmail`. A duplicate returns
`409 DUPLICATE_CLIENT_EMAIL`. Client records do not create Better Auth users and
grant no portal access. There is no hard-delete endpoint; the admin UI marks a
client `INACTIVE`.

Projects are read-only in Task 07. Project creation, editing, memberships,
milestones, and project updates are **not implemented**.

Services and portfolio entries use immutable slugs. `DELETE` archives rather
than destroys: it sets `isArchived`, unpublishes, and (for portfolio) removes
featured placement. Archived records can be restored through `PATCH` with
`{ "isArchived": false }`; they remain drafts. Published portfolio entries get
`publishedAt`; only published entries may be featured.

The public `/services` and `/work` pages still read static client content. The
new Service and PortfolioProject records are admin data until a separate public
content migration is approved. Public inquiry, health, and auth endpoints were
not changed.

### 9.1 Inquiries

| Method   | Endpoint               | Purpose                         |
| -------- | ---------------------- | ------------------------------- |
| `GET`    | `/admin/inquiries`     | List and filter inquiries       |
| `GET`    | `/admin/inquiries/:id` | View inquiry details            |
| `PATCH`  | `/admin/inquiries/:id` | Update allowed fields           |
| `DELETE` | `/admin/inquiries/:id` | Delete only when policy permits |

Supported list filters may include:

- `status`
- `assignedTo`
- `page`
- `limit`
- `search`

Rules:

- Apply server-side filtering and pagination.
- Validate allowed status transitions.
- Restrict assignment changes to authorized staff.
- Record important changes in the audit trail.
- Protect internal notes.
- Prefer archival or retention-based handling when permanent deletion would harm business records.

### 9.2 Clients

| Method   | Endpoint             | Purpose                                  |
| -------- | -------------------- | ---------------------------------------- |
| `GET`    | `/admin/clients`     | List clients                             |
| `POST`   | `/admin/clients`     | Create a client                          |
| `GET`    | `/admin/clients/:id` | Get client details                       |
| `PATCH`  | `/admin/clients/:id` | Update client details                    |
| `DELETE` | `/admin/clients/:id` | Deactivate or delete according to policy |

Before creating a client from a converted inquiry, prevent accidental duplicate conversion.

Do not automatically grant portal access when a client record is created. Account provisioning must be a separate, authorized operation.

### 9.3 Projects

| Method   | Endpoint              | Purpose                               |
| -------- | --------------------- | ------------------------------------- |
| `GET`    | `/admin/projects`     | List projects                         |
| `POST`   | `/admin/projects`     | Create a project                      |
| `GET`    | `/admin/projects/:id` | View project details                  |
| `PATCH`  | `/admin/projects/:id` | Update permitted fields               |
| `DELETE` | `/admin/projects/:id` | Archive or delete according to policy |

Rules:

- Validate the client relationship.
- Validate status transitions.
- Validate dates and project fields.
- Restrict changes to authorized users.
- Preserve project history where required.
- Validate team membership assignments.

### 9.4 Project Memberships

| Method   | Endpoint                              | Purpose                     |
| -------- | ------------------------------------- | --------------------------- |
| `GET`    | `/admin/projects/:id/members`         | List project members        |
| `POST`   | `/admin/projects/:id/members`         | Add a member                |
| `PATCH`  | `/admin/projects/:id/members/:userId` | Change permitted membership |
| `DELETE` | `/admin/projects/:id/members/:userId` | Remove a member             |

Every membership change must verify administrator permission and create an appropriate audit event.

### 9.5 Milestones

| Method   | Endpoint                         | Purpose                    |
| -------- | -------------------------------- | -------------------------- |
| `GET`    | `/admin/projects/:id/milestones` | List milestones            |
| `POST`   | `/admin/projects/:id/milestones` | Create milestone           |
| `PATCH`  | `/admin/milestones/:id`          | Update milestone           |
| `DELETE` | `/admin/milestones/:id`          | Delete when policy permits |

Verify the milestone's parent project before applying an operation.

### 9.6 Project Updates

| Method   | Endpoint                      | Purpose                    |
| -------- | ----------------------------- | -------------------------- |
| `GET`    | `/admin/projects/:id/updates` | List updates               |
| `POST`   | `/admin/projects/:id/updates` | Create an update           |
| `PATCH`  | `/admin/updates/:id`          | Edit an update             |
| `DELETE` | `/admin/updates/:id`          | Delete when policy permits |

Only authorized users may publish client-visible updates. Internal updates must remain inaccessible to client-facing endpoints.

### 9.7 Services

| Method   | Endpoint              | Purpose                               |
| -------- | --------------------- | ------------------------------------- |
| `GET`    | `/admin/services`     | List all services                     |
| `POST`   | `/admin/services`     | Create service                        |
| `GET`    | `/admin/services/:id` | Get service                           |
| `PATCH`  | `/admin/services/:id` | Update service                        |
| `DELETE` | `/admin/services/:id` | Archive or delete according to policy |

Validate slugs and prevent duplicate values.

### 9.8 Portfolio

| Method   | Endpoint               | Purpose                               |
| -------- | ---------------------- | ------------------------------------- |
| `GET`    | `/admin/portfolio`     | List all projects                     |
| `POST`   | `/admin/portfolio`     | Create portfolio project              |
| `GET`    | `/admin/portfolio/:id` | Get project                           |
| `PATCH`  | `/admin/portfolio/:id` | Update project                        |
| `DELETE` | `/admin/portfolio/:id` | Archive or delete according to policy |

Validate publication fields, URLs, and image references.

Do not expose unpublished content through public API routes.

### 9.9 Dashboard Summary

| Property | Value              |
| -------- | ------------------ |
| Method   | `GET`              |
| Endpoint | `/admin/dashboard` |
| Access   | Admin              |

Return only the aggregate information needed by the dashboard, such as:

- Inquiry counts by status.
- Active project counts.
- Recent inquiry summaries.
- Invoice balances based on verified financial records.
- Recent operational events.

Calculate financial totals on the server and define the currency or grouping used.

Do not calculate sensitive aggregate data from untrusted client-supplied values.

---

## 10. Client Portal APIs

Every portal endpoint must verify that the authenticated client is entitled to access the requested record.

### 10.1 Client Dashboard

| Property | Value               |
| -------- | ------------------- |
| Method   | `GET`               |
| Endpoint | `/portal/dashboard` |
| Access   | Authorized client   |

Return a summary of the current client's projects, upcoming milestones, unpaid invoices, and notifications.

### 10.2 List Projects

| Property | Value              |
| -------- | ------------------ |
| Method   | `GET`              |
| Endpoint | `/portal/projects` |
| Access   | Authorized client  |

Return only projects belonging to the authenticated client or explicitly assigned to that user under the documented access policy.

Never accept an arbitrary client ID as proof of ownership.

### 10.3 Project Details

| Property | Value                  |
| -------- | ---------------------- |
| Method   | `GET`                  |
| Endpoint | `/portal/projects/:id` |
| Access   | Authorized client      |

Return permitted project details, milestones, and client-visible updates.

Exclude internal notes, private team information, and unauthorized documents.

### 10.4 Project Updates

| Property | Value                          |
| -------- | ------------------------------ |
| Method   | `GET`                          |
| Endpoint | `/portal/projects/:id/updates` |
| Access   | Authorized client              |

Return client-visible updates only.

### 10.5 Client Invoices

| Property | Value              |
| -------- | ------------------ |
| Method   | `GET`              |
| Endpoint | `/portal/invoices` |
| Access   | Authorized client  |

Return invoices belonging to the authenticated client.

### 10.6 Invoice Details

| Property | Value                  |
| -------- | ---------------------- |
| Method   | `GET`                  |
| Endpoint | `/portal/invoices/:id` |
| Access   | Authorized client      |

Return the invoice only if the authenticated client is authorized to access it.

### 10.7 Payment Initiation

| Property | Value                                  |
| -------- | -------------------------------------- |
| Method   | `POST`                                 |
| Endpoint | `/portal/invoices/:id/payment-session` |
| Access   | Authorized client                      |

Purpose: Initiate a payment session with the configured payment provider.

Rules:

- Verify invoice ownership.
- Confirm the invoice is eligible for payment.
- Calculate the outstanding balance on the server.
- Use the configured provider SDK or documented API.
- Do not accept a browser-supplied payment amount as authoritative.
- Return only the provider's permitted payment-session details.
- Apply idempotency controls where supported.
- Do not mark the invoice paid at session creation.

If the selected provider uses a different checkout workflow, document and implement that provider's official flow instead.

---

## 11. Invoice Management APIs

| Method  | Endpoint                    | Purpose                       |
| ------- | --------------------------- | ----------------------------- |
| `GET`   | `/admin/invoices`           | List invoices                 |
| `POST`  | `/admin/invoices`           | Create a draft invoice        |
| `GET`   | `/admin/invoices/:id`       | View invoice                  |
| `PATCH` | `/admin/invoices/:id`       | Update permitted draft fields |
| `POST`  | `/admin/invoices/:id/issue` | Issue an invoice              |
| `POST`  | `/admin/invoices/:id/void`  | Void an eligible invoice      |

### Rules

- Restrict invoice creation and financial changes to authorized staff.
- Recalculate totals on the server.
- Validate invoice line items.
- Prevent duplicate invoice numbers.
- Apply defined invoice status transitions.
- Preserve issued invoice history.
- Do not edit paid invoices as if they were ordinary drafts.
- Use an explicit correction workflow for issued financial documents.

### Invoice creation example

```json
{
  "clientId": "client-id",
  "projectId": "project-id",
  "currency": "BDT",
  "items": [
    {
      "description": "Website development",
      "quantity": 1,
      "unitAmountMinor": 250000
    }
  ],
  "dueDate": "2026-12-31T00:00:00.000Z"
}
```

The amount is illustrative. The backend must determine whether the chosen currency uses this minor-unit representation and calculate all totals independently.

---

## 12. Payment APIs and Webhooks

### 12.1 List Payments

| Method | Endpoint              | Purpose              |
| ------ | --------------------- | -------------------- |
| `GET`  | `/admin/payments`     | List payment records |
| `GET`  | `/admin/payments/:id` | View payment details |

Restrict these endpoints to authorized financial administrators or explicitly permitted staff.

### 12.2 Payment Webhook

Example route:

```text
POST /api/v1/webhooks/payments/:provider
```

The exact webhook route must follow the selected provider's integration requirements.

Rules:

1. Verify the provider's signature using the required original request body.
2. Reject invalid signatures.
3. Validate event type and required identifiers.
4. Handle duplicate event delivery idempotently.
5. Confirm that the payment relates to the expected invoice.
6. Verify amount and currency.
7. Record the trusted payment event.
8. Recalculate the invoice balance safely.
9. Record important state changes in the audit trail.
10. Return the response required by the provider's documented webhook contract.

Do not use a generic authenticated-user middleware for webhooks if it prevents legitimate provider events. Webhook authentication must use the provider's signature or documented verification mechanism.

Do not trust browser redirects or client requests to establish successful payment.

---

## 13. Notifications APIs

| Method  | Endpoint                  | Purpose                               |
| ------- | ------------------------- | ------------------------------------- |
| `GET`   | `/notifications`          | List the current user's notifications |
| `PATCH` | `/notifications/:id/read` | Mark a notification as read           |
| `POST`  | `/notifications/read-all` | Mark eligible notifications as read   |

Rules:

- Require authentication.
- Restrict operations to the current user's records.
- Use pagination.
- Validate notification IDs.
- Never expose another user's notifications.
- Avoid accepting arbitrary redirect URLs without validation.

---

## 14. AI Feature APIs

Add AI endpoints only when a specific feature has been approved and implemented.

Potential examples:

| Method | Endpoint                            | Purpose                 |
| ------ | ----------------------------------- | ----------------------- |
| `POST` | `/admin/ai/inquiries/:id/summarize` | Summarize an inquiry    |
| `POST` | `/admin/ai/inquiries/:id/classify`  | Suggest a lead category |

Rules:

- Require appropriate authentication and authorization.
- Validate the referenced resource before sending content to an AI provider.
- Minimize the data sent externally.
- Apply usage limits and cost controls.
- Treat model output as untrusted.
- Do not allow AI output to change lead status or send messages automatically without the required authorization and approval.
- Never expose provider keys to the browser.
- Return a clear error if the provider is unavailable.

These are optional future endpoints, not a requirement to implement AI features during initial setup.

---

## 15. Pagination and Filtering

Use consistent query parameters where appropriate:

```text
?page=1&limit=20
```

Rules:

- Default to a reasonable page size.
- Set a maximum allowed page size.
- Validate positive integers.
- Reject or safely normalize invalid values according to the API's documented policy.
- Use stable sorting.
- Allowlist filterable and sortable fields.
- Do not pass raw client-supplied MongoDB query objects directly to Mongoose.

Example:

```text
GET /api/v1/admin/inquiries?status=NEW&page=1&limit=20
```

Do not expose arbitrary database operators through API query parameters.

---

## 16. Validation Strategy

Use Zod or an equivalent validation library.

For every endpoint, define:

- Required fields.
- Optional fields.
- Field types.
- Length limits.
- Accepted enumerated values.
- URL and date rules.
- Pagination constraints.
- Authentication requirements.
- Authorization rules.
- Expected success status.
- Expected failure responses.

Validation must run on the backend even if the frontend already validates the form.

For updates, reject fields that the caller is not allowed to modify rather than silently accepting privileged values.

---

## 17. Security Requirements

Implement these protections before production:

- HTTPS.
- Strict production CORS allowlist.
- Appropriate cookie security and CSRF protections.
- Authentication middleware for protected routes.
- Role and resource-level authorization.
- Request body size limits.
- Rate limiting.
- Safe request parsing.
- Validation and output sanitization.
- Safe error handling.
- Secure secret management.
- Database least privilege.
- Webhook signature verification.
- Duplicate-event protection.
- Audit logging for sensitive operations.
- Dependency and security updates.

Do not trust frontend route guards as the security boundary.

Avoid logging credentials, session cookies, authorization headers, payment secrets, or full sensitive payloads.

---

## 18. Testing Requirements

Write tests for the following cases.

### Public APIs

- Published services are returned.
- Unpublished services are not exposed.
- Published portfolio projects are returned.
- Unpublished projects are not exposed.
- Invalid inquiries are rejected.
- Rate limits work as intended.
- Repeated inquiry submissions are handled according to policy.

### Authentication and authorization

- Unauthenticated requests cannot access protected resources.
- Clients cannot access other clients' projects.
- Clients cannot access other clients' invoices.
- Team members cannot perform unauthorized administrative actions.
- Public registration cannot create administrators.
- Deactivated accounts cannot continue using protected resources.

### Financial APIs

- Invoice totals are calculated server-side.
- Invalid invoice transitions are rejected.
- Invalid webhook signatures are rejected.
- Duplicate webhook events do not duplicate payment effects.
- A browser redirect cannot independently mark an invoice paid.
- Payment amount and currency are verified.

### AI APIs

- Unauthorized users cannot invoke restricted features.
- Provider failures are handled safely.
- Usage limits are enforced.
- Model output cannot bypass business permissions.

Use isolated test data. Do not run destructive integration tests against production.

---

## 19. Implementation Order

Build the API in this sequence:

1. Backend bootstrap, configuration, and health check.
2. Centralized error handling and request validation.
3. Public services and portfolio endpoints.
4. Inquiry submission and persistence.
5. Inquiry administration.
6. Authentication integration and authorization middleware.
7. Client and project management.
8. Project membership, milestones, and updates.
9. Client portal endpoints.
10. Invoice management.
11. Payment provider integration and webhooks.
12. Notifications and audit events.
13. Optional AI endpoints.
14. Integration tests and security verification.

Keep `DATABASE.md` and `ARCHITECTURE.md` aligned with actual implementation decisions.

---

## 20. OpenCode Instructions

When implementing this specification:

1. Inspect the repository before writing code.
2. Read `PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, and `DATABASE.md`.
3. Verify current library and provider documentation.
4. Implement one endpoint or small related group at a time.
5. Create validation schemas before controllers.
6. Put business rules in service functions.
7. Apply authorization before accessing protected data.
8. Test success, invalid input, missing records, and forbidden access.
9. Never invent provider credentials or undocumented integration behavior.
10. Never mark unimplemented endpoints as complete.
11. Keep API documentation synchronized with actual behavior.
12. Explain unfamiliar backend concepts in beginner-friendly language.
