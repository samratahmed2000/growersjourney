# Growers Journy — System Architecture

**Brand:** Growers Journy  
**Tagline:** Build Smarter. Grow Faster.  
**Founder:** Samrat Ahmed  
**Role:** AI-Driven Web Application Engineer (MERN)  
**Document Type:** Technical Architecture Specification  
**Status:** Initial Architecture — Verify Compatibility Before Implementation

---

## 1. Project Overview

Build Growers Journy as a professional digital agency website and management platform.

The application must include:

1. Public agency website
2. Admin dashboard
3. Client portal
4. Lead and inquiry management
5. Dynamic portfolio and service management
6. Project and milestone tracking
7. Client and team management
8. Invoice and payment management
9. Email notifications
10. AI integration foundation
11. Secure MCP integration foundation
12. Testing, monitoring, and future scalability

The architecture must balance beginner-friendly development, maintainability, production security, and future growth.

**Core principle:** Build a modular monolithic application first. Avoid unnecessary microservices and overengineering.

---

## 2. Architecture Decisions

| Area                    | Decision                                       |
| ----------------------- | ---------------------------------------------- |
| Frontend                | Next.js App Router                             |
| UI framework            | React                                          |
| Language                | TypeScript                                     |
| Styling                 | Tailwind CSS                                   |
| Component library       | shadcn/ui                                      |
| Icons                   | Lucide React                                   |
| Backend                 | Node.js + Express.js                           |
| API style               | REST API                                       |
| Database                | MongoDB Atlas                                  |
| ODM                     | Mongoose for application-domain data           |
| Authentication          | Better Auth, after compatibility verification  |
| Validation              | Zod                                            |
| Forms                   | React Hook Form + Zod                          |
| Email                   | Provider-independent email service adapter     |
| Payments                | Provider-independent payment integration layer |
| Testing                 | Unit, integration, and end-to-end tests        |
| Version control         | Git + GitHub                                   |
| Frontend deployment     | Vercel or another compatible platform          |
| Backend deployment      | A Node.js-compatible hosting platform          |
| AI development          | OpenCode in VS Code                            |
| AI application features | Explicitly configured AI provider adapter      |
| MCP                     | Private, permission-controlled integrations    |

Do not install every library immediately. Confirm the requirements, compatibility, and current project dependencies before selecting exact versions.

---

## 3. High-Level System Architecture

```text
                         VISITORS
                            |
                            v
                  +--------------------+
                  |   Next.js Frontend |
                  |                    |
                  | Public Website     |
                  | Admin Dashboard    |
                  | Client Portal      |
                  +--------------------+
                            |
                  HTTPS / REST API
                            |
                            v
                  +--------------------+
                  |   Express Backend  |
                  |                    |
                  | Authentication     |
                  | Authorization      |
                  | Business Logic     |
                  | Input Validation   |
                  | API Controllers    |
                  | Background Jobs*   |
                  +--------------------+
                     |      |      |
                     |      |      |
                     v      v      v
                MongoDB   Email   Payment
                 Atlas   Provider Provider
                     |
                     v
              Application Records

                  +--------------------+
                  | External Services   |
                  |                    |
                  | AI Provider        |
                  | MCP Integrations   |
                  | Monitoring         |
                  +--------------------+
```

`*` Background jobs should be introduced only when required. Initially, use simple reliable processes and scheduled jobs supported by the chosen hosting environment.

All communication between deployed components must use HTTPS.

Never expose database credentials, payment secrets, authentication secrets, or AI provider keys to the browser.

---

## 4. Application Boundaries

Separate the application into the following logical areas.

### 4.1 Public Website

Purpose: Present the agency professionally and convert visitors into qualified leads.

Routes:

```text
/
 /services
 /work
 /work/[slug]
 /about
 /process
 /contact
 /privacy-policy
 /terms
```

Responsibilities:

- Display agency information.
- Present services and capabilities.
- Display published portfolio projects.
- Explain the development process.
- Collect inquiries.
- Provide contact and conversion actions.
- Render metadata for SEO.
- Provide accessible, responsive interfaces.

Public pages must not expose private client information, internal project records, unpublished portfolio items, or administrative data.

### 4.2 Admin Dashboard

Route prefix:

```text
/admin
```

Main sections:

```text
/admin
/admin/inquiries
/admin/clients
/admin/projects
/admin/services
/admin/portfolio
/admin/invoices
/admin/payments
/admin/team
/admin/notifications
/admin/settings
```

Responsibilities:

- Manage inquiries and lead status.
- Manage client records.
- Create and update projects.
- Manage milestones and project updates.
- Publish or unpublish portfolio projects.
- Manage agency services.
- Create and manage invoices.
- Review payment records and payment status.
- Manage team access and roles.
- View notifications and audit events.
- Configure approved application settings.

Every protected operation must be authorized by the backend. Hiding a button in the frontend is not an authorization mechanism.

### 4.3 Client Portal

Route prefix:

```text
/portal
```

Main sections:

```text
/portal
/portal/projects
/portal/projects/[projectId]
/portal/invoices
/portal/notifications
/portal/profile
/portal/settings
```

Responsibilities:

- Show the authenticated client's projects.
- Display milestones, progress, and authorized updates.
- Show invoices belonging to that client.
- Display payment status and available payment actions.
- Display authorized documents.
- Manage basic profile and notification preferences.

A client must never access another client's projects, invoices, documents, or private updates by changing an ID in a URL or API request.

Enforce ownership and access permissions on the server for every relevant request.

---

## 5. Frontend Architecture

Use the Next.js App Router and TypeScript.

Recommended structure:

```text
frontend/
├── public/
│   ├── images/
│   ├── icons/
│   └── logo/
│
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx
│   │   │   ├── services/
│   │   │   ├── work/
│   │   │   ├── about/
│   │   │   ├── process/
│   │   │   └── contact/
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── access-denied/
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── inquiries/
│   │   │   ├── clients/
│   │   │   ├── projects/
│   │   │   ├── services/
│   │   │   ├── portfolio/
│   │   │   ├── invoices/
│   │   │   └── settings/
│   │   │
│   │   ├── portal/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── projects/
│   │   │   ├── invoices/
│   │   │   └── profile/
│   │   │
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   └── loading.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── public/
│   │   ├── admin/
│   │   ├── portal/
│   │   └── shared/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── inquiries/
│   │   ├── clients/
│   │   ├── projects/
│   │   ├── portfolio/
│   │   ├── invoices/
│   │   ├── payments/
│   │   └── notifications/
│   │
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── env.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   │
│   ├── hooks/
│   ├── types/
│   └── styles/
│
├── tests/
├── .env.example
├── package.json
└── tsconfig.json
```

This is a proposed structure, not a requirement to create every folder immediately. Create directories when their corresponding features are implemented.

### Frontend rules

1. Prefer Server Components by default.
2. Use Client Components only when browser interactivity or client-side state requires them.
3. Keep business rules in the backend.
4. Do not connect to MongoDB directly from the browser.
5. Do not expose private environment variables through `NEXT_PUBLIC_` variables.
6. Keep API calls in a shared, typed API client.
7. Handle loading, empty, error, and success states.
8. Use reusable components without building unnecessary abstractions.
9. Keep route-specific logic close to the relevant feature.
10. Use semantic HTML and accessible form controls.

---

## 6. Backend Architecture

Use a standalone Express.js REST API.

Recommended structure:

```text
backend/
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   ├── database.ts
│   │   └── cors.ts
│   │
│   ├── middleware/
│   │   ├── authenticate.ts
│   │   ├── authorize.ts
│   │   ├── validate.ts
│   │   ├── rate-limit.ts
│   │   ├── error-handler.ts
│   │   └── not-found.ts
│   │
│   ├── modules/
│   │   ├── inquiries/
│   │   │   ├── inquiry.model.ts
│   │   │   ├── inquiry.validation.ts
│   │   │   ├── inquiry.service.ts
│   │   │   ├── inquiry.controller.ts
│   │   │   └── inquiry.routes.ts
│   │   │
│   │   ├── clients/
│   │   ├── projects/
│   │   ├── milestones/
│   │   ├── services/
│   │   ├── portfolio/
│   │   ├── invoices/
│   │   ├── payments/
│   │   ├── notifications/
│   │   └── audit/
│   │
│   ├── services/
│   │   ├── email.service.ts
│   │   ├── payment.service.ts
│   │   └── ai.service.ts
│   │
│   ├── utils/
│   ├── app.ts
│   └── server.ts
│
├── tests/
├── .env.example
├── package.json
└── tsconfig.json
```

### Implemented backend layout (current)

The tree above is the target design. What exists today is plain **JavaScript ESM**, not TypeScript:

```text
server/
├── app.js                 # createApp(): middleware stack + routes (no DB, no env)
├── index.js               # process bootstrap: env -> connect DB -> listen -> shutdown
├── config/
│   ├── env.js             # reads and validates process.env; the only `dotenv` user
│   └── database.js        # the only MongoDB connection owner; URI is passed in
├── constants/
│   └── inquiry.js         # status/service allowlists + field limits, shared by model and validator
├── models/
│   └── inquiry.js         # Mongoose Inquiry model (collection `inquiries`)
├── middleware/
│   ├── request-id.js      # generates `x-request-id`, sets req.id
│   ├── request-logger.js  # one log line per completed request
│   ├── validate.js        # Zod validation -> req.validated
│   ├── rate-limit.js      # express-rate-limit wrapper -> HttpError 429
│   ├── not-found.js       # terminal JSON 404
│   └── error-handler.js   # last middleware; maps errors to the response envelope
├── repositories/
│   └── inquiry-repository.js # the only writer of inquiries; injectable for tests
├── validators/
│   └── inquiry.js         # strict public schema + URL/email normalization
├── routes/
│   ├── health.js
│   └── inquiries.js       # POST /api/v1/inquiries
├── utils/
│   ├── api-response.js    # sendSuccess / sendError (the standard envelope)
│   ├── http-error.js      # HttpError + badRequest / notFoundError / payloadTooLarge
│   └── request-path.js    # full request path, query string stripped
├── scripts/
│   └── check-db.js
├── tests/                 # Node's built-in runner (`npm test`)
└── .env.example
```

Actual middleware order in `app.js` — the order is load-bearing:

```text
app.set("trust proxy") -> request id -> request logger
  -> cors (origin allowlist + exposed headers) -> express.json({ limit: "100kb" })
  -> /api/v1 routes (health, then rate-limited inquiries)
  -> GET / -> not found -> error handler
```

Why it is arranged this way:

- `createApp()` deliberately does **not** import `config/env.js`. That module validates configuration and calls `process.exit(1)` when something is missing, which would make the HTTP layer impossible to import in a test. The connection string is passed to `connectDatabase(uri)` by `index.js` instead.
- `createApp()` accepts `{ allowedOrigins, jsonLimit, logRequests, trustProxy, inquiryRepository, inquiryRateLimit }` so tests can run without a database, on an ephemeral port, with request logging off and a tiny rate limit.
- `trust proxy` is set before any middleware because the inquiry rate limiter keys on `req.ip`. `TRUST_PROXY` is `false` by default and only accepts a hop count; a permissive `true` would let callers forge `X-Forwarded-For` and reset their own bucket.
- The inquiry route mounts its own rate limiter, so only that public write endpoint is limited. The limiter's `429` is raised as an `HttpError` and rendered by the shared error handler, keeping one response envelope.
- The not-found handler and the error handler are registered last; the error handler keeps all four parameters because that is how Express identifies an error handler.
- `request-id` runs first so every later log line and error log can be correlated by id.

### Backend request flow

```text
Incoming Request
      |
      v
Request ID / Logging
      |
      v
Security Middleware
      |
      v
Authentication (when required)
      |
      v
Authorization (when required)
      |
      v
Request Validation
      |
      v
Controller
      |
      v
Service / Business Logic
      |
      v
Model / Database
      |
      v
Standardized Response
```

Not every request requires authentication. Public portfolio reads may be anonymous, while administrative changes and private client records require appropriate authentication and authorization.

### Backend rules

- Keep route definitions separate from business logic.
- Controllers should remain relatively thin.
- Put reusable business rules in service functions.
- Validate incoming data at the API boundary.
- Validate resource ownership before returning private records.
- Use consistent error responses.
- Avoid returning raw database documents indiscriminately.
- Never trust client-provided role, price, payment status, or ownership fields.
- Use transactions when a multi-document operation requires atomic consistency and the deployment supports the required MongoDB transaction configuration.
- Use pagination and appropriate database indexes for growing collections.

---

## 7. Authentication Architecture

Use Better Auth only after verifying its current official support for the chosen Next.js, Express, MongoDB, and database-adapter configuration.

Before implementation, answer these questions:

1. Where will Better Auth run?
2. How will the Express API validate an authenticated session?
3. Which official adapter will manage authentication data?
4. How will cookies be shared safely across frontend and backend origins?
5. What production cookie, CORS, and CSRF protections are required?

Do not assume that installing Better Auth automatically secures a separate Express API.

### Recommended authentication boundary

```text
User
 |
 v
Next.js Frontend
 |
 v
Configured Better Auth Integration
 |
 v
Trusted Session Validation
 |
 v
Express API Authorization
 |
 v
Protected Resource
```

The implementation must establish one clear, trusted session-validation mechanism.

### Implemented boundary (Task 06)

```text
Browser
  |  same-origin POST /api/auth/*
  v
Next.js rewrite (next.config.ts)
  |
  v
Express: Better Auth handler at /api/auth/*
  |
  v
@better-auth/mongo-adapter -> MongoDB (user, session, account, verification)
  ^
  |  auth.api.getSession({ headers })
  |
Express: requireAuth / requireRole -> /api/v1 protected route
```

- Better Auth runs only in Express. Next.js forwards the auth path and, for protected layouts, calls `GET /api/v1/auth/me` server-side with the browser cookie. Next does not verify signatures.
- The cookie is host-only on the site origin (`Path=/`, `HttpOnly`, `SameSite=Lax`, `Secure` on HTTPS), so the same-origin rewrite is what makes the browser session work without exposing it to browser storage.
- Every protected Express request is validated independently of Next navigation. The Next layouts are a usability guard, not the security boundary.
- Admin and portal areas are separate: `ADMIN`/`TEAM_MEMBER` for `/admin`, `CLIENT` for `/portal`. Staff do not get implicit portal access.
- `server/auth/access-control.js` provides the object-level pattern: `ownedByQuery(user)` for query scoping and `assertResourceOwner({ user, resource })` for loaded records. Cross-client access returns `404` so existence is not leaked. Staff ownership requires a separate explicit grant.
- The secure initial administrator is created by `server/scripts/create-admin.js` through `auth.api.createUser`; there is no public sign-up and no writable role field.

If official integration requires a different deployment arrangement, update this architecture before changing the code.

### Roles

```text
ADMIN
TEAM_MEMBER
CLIENT
```

Initial permissions:

| Capability                    | Admin |              Team Member |            Client |
| ----------------------------- | ----: | -----------------------: | ----------------: |
| Manage all inquiries          |   Yes |         Permission-based |                No |
| Manage users and roles        |   Yes |            No by default |                No |
| Manage all projects           |   Yes |   Assigned projects only |                No |
| View assigned client projects |   Yes |              If assigned | Own projects only |
| Manage invoices               |   Yes | Explicit permission only | View own invoices |
| Manage published portfolio    |   Yes | Explicit permission only |                No |
| Access admin settings         |   Yes |            No by default |                No |

Start with simple, explicit role-based access control. Add finer-grained permissions only when the business needs them.

Never allow a public registration request to assign the `ADMIN` role.

Provision the first administrator through a secure, documented setup process.

---

## 8. Database Architecture

Use MongoDB Atlas for hosted database infrastructure and Mongoose for application-domain models.

Organize data into separate logical collections, including:

```text
users
services
portfolioProjects
inquiries
clients
projects
projectMemberships
milestones
projectUpdates
invoices
payments
notifications
auditEvents
aiUsageRecords
```

The final collection design belongs in `DATABASE.md`.

### Authentication data boundary

If Better Auth uses its official MongoDB adapter, let that adapter manage its own authentication records.

Do not create competing custom session or account models for the same authentication mechanism.

Application-domain data may use Mongoose models in the same MongoDB database, provided collection ownership, naming, indexes, and connection lifecycle are clearly defined.

Do not assume the official Better Auth MongoDB adapter uses Mongoose.

### Database connection rules

- Keep database credentials in backend-only environment variables.
- Reuse a properly managed database connection.
- Do not open a new database connection for every request.
- Add indexes for frequently queried fields and unique constraints where required.
- Store timestamps for important records.
- Define deletion and retention policies for sensitive records.
- Avoid storing unnecessary personal information.
- Do not store raw card details or payment credentials.
- Never commit database credentials to Git.

---

## 9. API Communication

Use a versioned API prefix:

```text
/api/v1
```

Example endpoints:

```text
GET    /api/v1/health
GET    /api/v1/services
GET    /api/v1/portfolio
GET    /api/v1/portfolio/:slug

POST   /api/v1/inquiries

GET    /api/v1/admin/inquiries
PATCH  /api/v1/admin/inquiries/:id

GET    /api/v1/admin/projects
POST   /api/v1/admin/projects
GET    /api/v1/admin/projects/:id
PATCH  /api/v1/admin/projects/:id

GET    /api/v1/portal/projects
GET    /api/v1/portal/invoices
```

These are illustrative endpoints. The complete route list, request schemas, permissions, response formats, and error codes must be specified in `API.md`.

### API rules

- Use HTTPS in production.
- Validate every request body, query, and path parameter.
- Apply rate limits to public forms and sensitive endpoints.
- Use appropriate HTTP status codes.
- Do not expose stack traces to clients.
- Restrict CORS to configured frontend origins.
- Protect cookie-based authenticated requests against CSRF as appropriate.
- Enforce authorization at the resource level.
- Use pagination for large lists.
- Keep the API contract documented.
- Avoid returning unnecessary internal fields.

### Example response format

Success:

```json
{
  "success": true,
  "data": {
    "id": "resource-id"
  }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted information."
  }
}
```

Do not return confidential debugging information in production responses.

---

## 10. Inquiry and Lead Management

Public inquiry flow:

```text
Visitor
  |
  v
Contact Form
  |
  v
Frontend Validation
  |
  v
Express API
  |
  v
Server-side Validation
  |
  v
Spam / Rate-limit Checks
  |
  v
Database Persistence
  |
  v
Email Notification
  |
  v
Admin Lead Management
```

Requirements:

- Store validated inquiries before attempting nonessential notification delivery.
- Avoid creating duplicate leads through accidental repeated submissions where practical.
- Use rate limiting and appropriate spam protection.
- Track lead status and relevant timestamps.
- Notify authorized agency personnel.
- Do not expose inquiry records publicly.
- Do not lose a saved inquiry because an email provider is temporarily unavailable.

If reliable retries become necessary, introduce a job queue or an outbox pattern. Do not add these systems before there is a clear requirement.

---

## 11. Invoice and Payment Architecture

Keep invoice creation, payment processing, and payment verification separate.

```text
Admin Creates Invoice
        |
        v
Server Calculates Totals
        |
        v
Invoice Issued
        |
        v
Client Opens Payment Option
        |
        v
Payment Provider
        |
        v
Verified Webhook / Server Verification
        |
        v
Payment Record Created
        |
        v
Invoice Balance Recalculated
```

Security requirements:

1. Calculate totals on the server.
2. Never trust a price or payment status supplied by the browser.
3. Verify webhook signatures.
4. Handle duplicate webhook events idempotently.
5. Keep payment-provider secrets on the server.
6. Maintain a clear audit trail.
7. Separate initiated, pending, successful, failed, and refunded payments where applicable.
8. Reconcile invoice balances with verified payment records.
9. Never mark an invoice paid based only on a browser redirect.
10. Select a payment provider based on supported countries, business eligibility, and the agency's actual needs.

Payment integration must remain disabled until provider credentials and verification procedures are configured.

**Task 09 status:** invoice CRUD, issue/void, server-calculated totals, the verified
payment ledger, partial payments, refunds, reconciliation hooks, signed webhook
verification, and duplicate-event handling are implemented. The only provider
is the local `FAKE` sandbox adapter; it is refused in production and moves no
money. A real provider (SSLCommerz or aamarPay, still unconfirmed) must be added
only after merchant approval, credentials, currency support, fee/settlement
terms, refund behavior, and webhook contracts are settled. Live payments remain
disabled until then.

---

## 12. AI Integration Architecture

Keep application-facing AI functionality behind a dedicated service interface.

```text
Frontend Feature
      |
      v
Express API
      |
      v
Authorization + Validation
      |
      v
AI Service Layer
      |
      v
Configured AI Provider
      |
      v
Validated Result
```

Potential future features:

- AI-assisted inquiry classification.
- Drafting inquiry summaries.
- Project update summaries.
- Content drafting for portfolio projects.
- Internal agency productivity tools.
- AI-powered client support, if appropriate.

Do not implement all features at once. Start with one narrowly scoped use case.

### AI rules

- Never expose AI provider API keys in frontend code.
- Apply authentication and authorization to private AI features.
- Validate model output before using it.
- Treat user-provided content as untrusted input.
- Do not let model output directly execute database writes or privileged operations.
- Add usage limits and cost monitoring.
- Avoid sending confidential client information to external providers without an approved data-handling policy.
- Record only the AI usage metadata needed for operational and cost monitoring.
- Provide graceful error handling when an AI provider is unavailable.

AI must assist the workflow, not bypass application security or human approval.

---

## 13. MCP Integration Architecture

MCP is an integration mechanism, not an automatic requirement for every application feature.

Potential future uses:

- Internal development tools.
- Approved project-management integrations.
- Authorized documentation search.
- Restricted agency productivity workflows.

Before adding an MCP server, document its purpose, tools, permissions, and data access.

### MCP security boundaries

- Never expose MCP credentials to the browser.
- Do not create a public MCP server unless there is a verified business requirement.
- Use least-privilege access.
- Separate read-only tools from write-capable tools.
- Require explicit approval for consequential actions where appropriate.
- Validate tool arguments.
- Log sensitive administrative actions without logging secrets.
- Do not allow arbitrary model-generated commands to execute on the production server.
- Keep MCP configuration and secrets out of source control.

OpenCode's development-time capabilities must remain separate from production application permissions.

---

## 14. Email and Notification Architecture

Use a provider-independent email service.

Example interface:

```ts
interface EmailService {
  sendInquiryNotification(input: {
    inquiryId: string;
    name: string;
    email: string;
    service: string;
  }): Promise<void>;
}
```

The actual implementation must validate inputs, avoid logging sensitive content unnecessarily, and use a configured provider.

Notification types may include:

- New inquiry.
- Inquiry status changed.
- Project update published.
- Milestone completed.
- Invoice issued.
- Payment verified.
- Important account or security event.

Email delivery failure must not automatically undo a successful database operation.

Add retry processing only when the deployment and operational requirements support it.

---

## 15. Validation and Error Handling

Use Zod or an equivalent shared validation strategy.

Validate data at these boundaries:

1. Frontend forms for user experience.
2. Backend API requests for security and correctness.
3. External webhook payloads after required authenticity verification.
4. AI outputs before using them in application workflows.
5. Environment variables during application startup.

Frontend validation is not a replacement for backend validation.

### Error categories

```text
VALIDATION_ERROR
UNAUTHENTICATED
FORBIDDEN
NOT_FOUND
CONFLICT
RATE_LIMITED
EXTERNAL_SERVICE_ERROR
INTERNAL_SERVER_ERROR
```

Return safe messages to users. Keep detailed diagnostic information in access-controlled server logs.

Never expose passwords, session tokens, API keys, database connection strings, or payment secrets in logs or error responses.

### Implemented error codes and validation (Task 03)

The category list above is the target naming. The codes that are actually returned today are:

```text
VALIDATION_ERROR      400  Zod request validation failed (details: [{ field, message }])
INVALID_JSON          400  request body is not valid JSON
NOT_FOUND             404  unmatched route, wrong method, or missing resource
PAYLOAD_TOO_LARGE     413  body exceeded the JSON limit (100kb by default)
RATE_LIMIT_EXCEEDED   429  reserved; not returned yet (no rate limiter installed)
INTERNAL_ERROR        500  unexpected server failure (generic message only)
DATABASE_UNAVAILABLE  503  readiness check could not reach MongoDB
```

- Validation lives in `server/middleware/validate.js` and uses **Zod 4** (`zod@^4`). It runs at the API boundary, before any controller.
- Parsed input is stored on `req.validated` (`{ params, query, body }`) rather than written back onto the request. In Express 5, `req.query` is a getter-only property, so assigning to it throws; one predictable location is also easier to reason about.
- Zod object schemas strip unknown keys, so unexpected or privileged fields (for example a client-supplied `role`) are discarded instead of reaching the database layer.
- Validation failures return only a field path and the schema's message. The submitted value is never echoed back, because rejected input can itself contain secrets.
- Stack traces are never sent to a client in any environment. Full diagnostics are written to server-side logs with the request id.
- Error text is **redacted before logging** (`server/utils/redact.js`): credentials in URLs, `Bearer`/`Basic` values, `key=value`/`key: value` forms, and JWTs are masked, and long text is truncated. Ordinary lines are left untouched so logs stay readable. Redaction is applied to `error.message` and `error.stack`, since a driver or SDK message can embed a connection string.
- Request bodies, headers, cookies, and query strings are never logged at all. Note that a body-parser error carries the offending body in `error.body`; it is deliberately never read.

---

## 16. Environment Configuration

Maintain separate environment configuration for frontend and backend.

### Frontend `.env.example`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
```

Only variables explicitly intended for browser exposure may use the `NEXT_PUBLIC_` prefix.

### Backend `.env.example`

```env
NODE_ENV=development
PORT=5000

FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/growers_journy?retryWrites=true&w=majority

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

EMAIL_PROVIDER=
EMAIL_API_KEY=
EMAIL_FROM=

INVOICE_SUPPORTED_CURRENCIES=BDT
INVOICE_NUMBER_PREFIX=INV
INVOICE_TIMEZONE=Asia/Dhaka
INVOICE_OVERDUE_GRACE_DAYS=0
INVOICE_TAX_ENABLED=false
INVOICE_DISCOUNT_ENABLED=false

PAYMENTS_ENABLED=false
PAYMENT_PROVIDER=FAKE
PAYMENT_ENVIRONMENT=SANDBOX
PAYMENT_WEBHOOK_SECRET=
PAYMENT_PUBLIC_BASE_URL=

AI_PROVIDER=
AI_API_KEY=
```

These names are illustrative. Confirm the exact variable names required by the selected library versions and integrations.

Do not invent production secrets or use placeholder values as real credentials.

The final environment setup instructions belong in `Setup.md`.

---

## 17. Deployment Architecture

Recommended initial deployment:

```text
GitHub Repository
      |
      +--------------------+
      |                    |
      v                    v
Next.js Frontend      Express Backend
Vercel or similar     Node-compatible host
      |                    |
      +----------+---------+
                 |
                 v
            MongoDB Atlas
                 |
        +--------+---------+
        |                  |
        v                  v
   Email Provider    Payment Provider
```

Deployment rules:

- Confirm that the selected backend host supports the chosen Express runtime.
- Do not assume a persistent Express server can be deployed unchanged to every serverless platform.
- Configure production environment variables securely.
- Restrict production CORS origins.
- Use secure cookies and the correct trusted-proxy configuration when required by the hosting environment.
- Configure database network access using the least privilege practical for the deployment.
- Add health checks and structured logs.
- Use separate development and production credentials.
- Test authentication and payment webhooks in staging before production.
- Maintain a documented backup and recovery strategy.

---

## 18. Testing Architecture

Use a layered testing strategy.

### Unit tests

Test isolated business rules such as:

- Inquiry validation.
- Invoice calculations.
- Role and permission checks.
- Payment status transitions.
- Data transformation utilities.

### Integration tests

Test interactions between:

- Express routes and middleware.
- Services and database models.
- Authentication and protected API routes.
- Inquiry persistence and notification handling.
- Webhook verification and payment processing.

### End-to-end tests

Test important user journeys:

1. Visitor submits an inquiry.
2. Admin signs in.
3. Admin reviews and updates an inquiry.
4. Admin creates a project.
5. Client accesses only authorized project data.
6. Admin issues an invoice.
7. Payment status changes only after server-side verification.

Use test data and test credentials. Never run destructive tests against production data.

### Implemented test tooling (Task 03)

The backend uses Node's built-in test runner, so **no test dependency is installed**:

```bash
cd server
npm test           # node --test
npm run test:watch # node --test --watch
```

- Tests live in `server/tests/*.test.js` and use `node:assert/strict` and the global `fetch`.
- `server/tests/helpers/server.js` starts the app on port `0` (ephemeral) with request logging disabled, and closes connections before shutting the server down.
- The tests require **no MongoDB**: liveness must not depend on the database, and readiness is asserted to degrade to `503`.
- Jest, Vitest, Supertest, and Playwright are **not** installed. Do not document them as available; introducing one is a deliberate decision to confirm with the owner first.

---

## 19. Performance and Scalability

Start simple, but establish sound boundaries.

- Paginate admin tables and large API responses.
- Add database indexes based on actual query patterns.
- Avoid fetching private or unnecessary data.
- Optimize images and use responsive image delivery.
- Cache only data that can safely be cached.
- Revalidate public portfolio and service pages when content changes.
- Avoid caching authenticated responses across users.
- Set request timeouts for external services.
- Use idempotency where duplicate requests could create financial or operational problems.
- Monitor API errors, response times, database health, and AI usage costs.

Do not introduce microservices, distributed caching, event streaming, or complex orchestration without evidence that the application needs them.

---

## 20. Implementation Order

Build the platform in controlled phases.

### Phase 1 — Foundation

- Inspect existing files and repository.
- Confirm architecture and dependency compatibility.
- Set up frontend and backend projects.
- Configure TypeScript, linting, formatting, and environment validation.
- Establish Git conventions.
- Add health endpoints and basic error handling.

### Phase 2 — Public Website

- Build the shared design system.
- Create navigation, footer, and responsive layouts.
- Build Home, Services, Work, About, Process, and Contact pages.
- Add accessible form validation and SEO metadata.

### Phase 3 — Database and Inquiries

- Configure MongoDB Atlas and Mongoose.
- Create the inquiry model.
- Implement inquiry validation and persistence.
- Add email notifications and rate limiting.
- Test the full inquiry workflow.

### Phase 4 — Authentication and Authorization

- Verify Better Auth compatibility.
- Establish trusted session validation between the frontend and Express API.
- Provision the first administrator securely.
- Implement role-based access control.
- Test unauthorized and cross-client access.

### Phase 5 — Admin Dashboard

- Implement inquiry management.
- Add service and portfolio management.
- Add clients and projects.
- Add milestones and project updates.

### Phase 6 — Client Portal

- Display authorized projects.
- Add milestone and update views.
- Add client-specific invoices.
- Enforce object-level access control.

### Phase 7 — Financial Features

- ~~Implement invoice management.~~ (Task 09: implemented)
- ~~Verify webhooks and duplicate-event protection.~~ (Task 09: implemented
  for the `FAKE` sandbox; real-provider signatures are still pending)
- Add the selected payment provider (pending merchant approval and credentials).
- Test payment and invoice reconciliation against a real provider sandbox.

### Phase 8 — AI and MCP

- Define the first AI use case.
- Implement the AI service adapter.
- Add usage controls and error handling.
- Evaluate MCP integrations individually.
- Apply least-privilege permissions.

### Phase 9 — Quality and Deployment

- Run unit, integration, and end-to-end tests.
- Perform accessibility and responsive checks.
- Review security and dependency risks.
- Configure production deployment.
- Verify backups, logs, health checks, and recovery procedures.

Do not start later phases until their critical dependencies are ready.

---

## 21. OpenCode Implementation Rules

When using OpenCode in VS Code:

1. Read `PRD.md`, `DESIGN.md`, and this file before implementation.
2. Inspect the existing repository before creating or modifying files.
3. Do not overwrite existing work without understanding its purpose.
4. Implement one small, testable feature at a time.
5. Explain important architectural decisions in beginner-friendly language.
6. Prefer simple, readable TypeScript over unnecessary abstraction.
7. Follow the existing project's package manager and conventions.
8. Verify library APIs against current official documentation.
9. Run relevant linting, type checks, and tests after meaningful changes.
10. Fix errors before proceeding to dependent features.
11. Never invent environment credentials or expose secrets.
12. Do not claim a feature is complete unless it has been implemented and appropriately verified.
13. Update documentation when architecture or dependencies change.
14. Ask for approval before destructive actions or consequential external operations.
15. Do not generate the entire platform in one uncontrolled code-writing step.

### Definition of done for each feature

A feature is complete only when:

- Requirements are understood.
- Validation is implemented.
- Authorization is enforced where required.
- Loading, empty, success, and error states are handled where applicable.
- Relevant tests pass.
- Type checking and linting pass, or remaining issues are clearly documented.
- No secrets are exposed.
- Documentation is updated when necessary.

---

## 22. Architecture Decision Log

Record important decisions in this section or in a dedicated architecture decision record.

| Decision       | Initial position                      | Verification required                       |
| -------------- | ------------------------------------- | ------------------------------------------- |
| Frontend       | Next.js App Router                    | Confirm current project compatibility       |
| Backend        | Standalone Express API                | Confirm hosting and runtime                 |
| Database       | MongoDB Atlas                         | Configure secure connectivity               |
| Domain models  | Mongoose                              | Define collections and indexes              |
| Authentication | Better Auth                           | Verify adapter and Express integration      |
| Session trust  | Explicit server-side validation       | Test cookie and cross-origin behavior       |
| Payments       | Provider-independent adapter          | Confirm provider eligibility and webhooks   |
| AI             | Server-side provider adapter          | Confirm data handling and cost limits       |
| MCP            | Private and least-privilege           | Confirm actual use cases before enabling    |
| Deployment     | Separate frontend and API deployments | Verify environment and domain configuration |

If a compatibility issue is discovered, stop and document the options before replacing a major dependency or changing the architecture.

---

## 23. Final Architecture Principles

Growers Journy must follow these principles:

- Security before convenience.
- Clear boundaries between frontend and backend.
- Server-side authorization for every protected resource.
- One trusted authentication strategy.
- Validated input and safe error handling.
- Verified payment state.
- Minimal and controlled AI permissions.
- Accessible, responsive design.
- Beginner-friendly implementation with professional standards.
- Incremental development with tests.
- Documented architectural decisions.
- Scale based on real requirements rather than speculation.
