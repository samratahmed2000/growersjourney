# Integration Guide — Growers Journy

## 1. Purpose

This document defines how all application components and external services must integrate into the Growers Journy platform.

The goal is to build a secure, maintainable, production-ready agency management platform without tightly coupling components or introducing unnecessary dependencies.

**Core principle:** Implement and verify one integration at a time. Never assume an integration works until it has been tested.

## 2. Project Architecture

Use the following architecture:

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui.
- **Backend:** Node.js, Express.js, REST API.
- **Database:** MongoDB Atlas with Mongoose.
- **Authentication:** Better Auth, after confirming compatibility with the selected database adapter and backend architecture.
- **Email:** A suitable transactional email provider.
- **Payments:** A provider selected according to business requirements, country support, and payment regulations.
- **AI:** A provider-based integration layer for selected AI services.
- **MCP:** Optional integrations for authorized tools and workflows.
- **Deployment:** Vercel or another suitable frontend host, plus a Node.js-compatible backend host.

Use this logical structure where appropriate:

```text
frontend/
  src/
    app/
    components/
    lib/
      api/
      auth/
      validation/

backend/
  src/
    config/
    middleware/
    routes/
    controllers/
    services/
    models/
    integrations/
    utils/

docs/
```

Adapt the structure to the existing repository rather than restructuring working code unnecessarily.

## 3. Integration Rules

1. Inspect the existing codebase before changing files.
2. Define the interface between components before implementation.
3. Keep API calls, business logic, database operations, and UI responsibilities separate.
4. Validate external input on the server.
5. Keep secrets and privileged operations on the server.
6. Use TypeScript types and shared API contracts where practical.
7. Handle loading, success, empty, and error states in the UI.
8. Use timeouts for external requests where supported.
9. Retry only appropriate transient failures; avoid retrying payment creation or other non-idempotent actions without an idempotency strategy.
10. Add automated tests for critical integration paths.
11. Never fabricate provider credentials, API responses, payment status, or successful test results.

## 4. Frontend–Backend Integration

The Next.js frontend must communicate with the Express backend through documented REST endpoints.

Use the API prefix:

`/api/v1`

Create a reusable API client that handles:

- Base URL configuration.
- JSON request and response handling.
- Request headers.
- Authentication credentials when required.
- Validation and API errors.
- Network failures and request timeouts.
- Appropriate request methods.
- Typed request and response data.

Do not scatter raw `fetch()` calls throughout unrelated components. Use the shared API client or a clearly defined feature-level API module.

### Required integration behavior

- Contact forms submit to the backend.
- Public services and portfolio pages load from their intended data sources.
- Admin pages load only data the signed-in admin is authorized to access.
- Client portal pages retrieve only the authenticated client's authorized resources.
- Mutations display clear success or error feedback.
- Protected operations are authorized by the backend, not merely hidden in the frontend.

Avoid hardcoding production API URLs. Use environment variables.

## 5. API Contract

Every endpoint must have a defined contract containing:

- HTTP method and path.
- Authentication requirements.
- Required role or permissions.
- Request schema.
- Response schema.
- Validation rules.
- Expected status codes.
- Error format.
- Rate-limiting requirements where relevant.

Use a consistent error response, for example:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted information."
  }
}
```

The example is a proposed contract, not an existing endpoint response. Implement and document the final contract consistently.

Never expose stack traces, internal database details, secrets, or sensitive authentication information to clients.

## 6. Database Integration

Connect the Express backend to MongoDB Atlas through Mongoose.

Requirements:

- Keep database connection configuration in a dedicated module.
- Read the connection string from a server-only environment variable.
- Fail safely if required database configuration is missing.
- Reuse the established connection rather than opening a new connection per request.
- Define schemas, validation, indexes, and relationships according to actual application requirements.
- Use pagination for potentially large collections.
- Validate IDs and query parameters before database operations.
- Handle duplicate-key errors and database failures.
- Prevent unauthorized users from querying another client's records.
- Avoid returning password hashes, private tokens, or internal fields.

Do not connect the browser directly to MongoDB Atlas.

### Authentication adapter compatibility

Before combining Better Auth with MongoDB and Mongoose:

1. Verify the current Better Auth documentation for the supported database adapters.
2. Determine whether the selected adapter can work with the existing database architecture.
3. Do not assume Better Auth can use arbitrary Mongoose models directly.
4. Choose a supported, documented integration approach before implementing authentication.
5. Keep application business models separate from authentication storage when necessary.

Do not introduce a second database or duplicate authentication records without a documented reason.

## 7. Authentication Integration

Better Auth is the preferred authentication option, subject to compatibility verification.

**Implemented in Task 06:** `better-auth@1.7.11` runs in Express with the official `@better-auth/mongo-adapter@1.7.11`; the browser uses same-origin `/api/auth/*`, which Next rewrites to Express. Express re-validates every protected request with `auth.api.getSession({ headers })`. Admin and portal access is role-checked server-side, and no token is stored in browser storage. See `Authentication-Security.md` §4 and `API.md` §8 for the full contract.

Integrate authentication across Next.js and Express only after confirming the supported session-validation approach.

Requirements:

- Support Admin, Team Member, and Client roles.
- Protect private routes and API endpoints.
- Validate sessions on the server.
- Enforce authorization in Express for every protected operation.
- Prevent users from assigning themselves privileged roles.
- Provision the initial administrator securely.
- Use secure cookie and session settings appropriate to the deployment environment.
- Configure trusted origins and authentication URLs correctly.
- Protect state-changing operations against relevant CSRF risks.

A Next.js middleware check or hidden navigation item is not a substitute for backend authorization.

Never assume an authenticated Next.js session automatically authenticates requests to Express. Test the complete browser-to-API authentication flow.

## 8. Contact Form and Email Integration

The contact form must send submissions to the Express backend.

Required fields:

- Name.
- Business email.
- Requested service.
- Project description.

Optional fields:

- Company.
- Budget.
- Timeline.
- Reference URL.

### Submission workflow

1. Validate the form in the frontend for usability.
2. Validate all submitted data again on the backend.
3. Apply rate limiting and appropriate spam-prevention measures.
4. Store the inquiry in MongoDB.
5. Trigger an email notification using the configured email provider.
6. Return a response that accurately reflects the inquiry-storage result.
7. Show the user a clear confirmation or error message.
8. Allow authorized admins to review and update inquiry status.

Email delivery and database persistence are separate operations. Do not report that an email was delivered unless delivery has actually been confirmed.

If an inquiry is saved but email notification fails, preserve the inquiry and provide a reliable retry or notification-recovery mechanism. Avoid creating duplicate inquiries when retrying email delivery.

Use a verified sender domain and server-side email credentials.

## 9. Payment Integration

Implement payment integration only after selecting a suitable provider and verifying its availability, legal requirements, and supported payment methods.

**Task 09 implementation status:** the provider-independent payment foundation,
server-calculated invoices, verified ledger, refunds, reconciliation hook, webhook
signature verification, and duplicate-event handling are implemented. The only
provider adapter is `FAKE`, a local sandbox that is refused in production and
moves no real money. SSLCommerz and aamarPay remain candidates only; neither is
implemented or confirmed, and no fee, settlement, or refund terms are invented.

Implemented environment names (server-only):

- `INVOICE_SUPPORTED_CURRENCIES` (V1: BDT), `INVOICE_NUMBER_PREFIX`,
  `INVOICE_TIMEZONE`, `INVOICE_OVERDUE_GRACE_DAYS`, `INVOICE_TAX_ENABLED`,
  `INVOICE_DISCOUNT_ENABLED`
- `PAYMENTS_ENABLED`, `PAYMENT_PROVIDER=FAKE`, `PAYMENT_ENVIRONMENT=SANDBOX`
- `PAYMENT_WEBHOOK_SECRET` (at least 32 characters when payments are enabled)
- optional `PAYMENT_MOCK_TOKEN_SECRET` (falls back to the webhook secret)
- `PAYMENT_PUBLIC_BASE_URL` (the public API origin used in mock/webhook URLs)

Requirements:

- Calculate invoice totals on the backend.
- Keep invoice amounts and payment status authoritative on the server.
- Never trust a client-submitted amount as the amount due.
- Create payment requests through the backend.
- Verify webhook signatures using the provider's documented procedure.
- Handle duplicate webhook events idempotently.
- Record payment references and transaction statuses.
- Distinguish initiated, pending, successful, failed, refunded, and other relevant provider states.
- Update invoice balances only through verified server-side events or documented provider verification.
- Never store raw card details unless the architecture is explicitly authorized and compliant; prefer provider-hosted or tokenized payment flows.

A browser redirect or frontend success message alone does not prove that a payment succeeded.

Test payment flows in the provider's sandbox before production use. Before
adding a real provider, review its merchant onboarding, fee/settlement terms,
webhook contract, refund semantics, currency support, and production
credentials. Add the adapter behind `server/payments/create-provider.js` without
changing the invoice ledger or exposing provider secrets to the browser.

## 10. AI Integration

Keep AI integrations inside the backend or another appropriately secured server-side execution environment.

Create a provider-independent service interface where practical so providers can be replaced without rewriting the entire application.

Potential features include:

- AI-assisted inquiry classification.
- Drafting project proposals.
- Generating project summaries.
- Business workflow automation.
- Authorized internal knowledge assistance.

Requirements:

- Store API keys in server-only environment variables.
- Validate and limit user input.
- Apply request timeouts, quotas, and usage limits.
- Handle provider errors and rate limits.
- Track relevant usage and costs without unnecessarily retaining sensitive prompts.
- Treat model output as untrusted input.
- Require human review for important business decisions and external actions.
- Never expose private client data to an AI provider without appropriate authorization and data-handling controls.

AI functionality must not block essential website operations when the provider is unavailable.

## 11. MCP Integration

MCP is optional and must be introduced only for a defined use case.

Keep these separate:

- **Development MCP:** Tools configured for OpenCode during software development.
- **Application MCP:** Tools that the deployed application intentionally exposes or consumes.

Do not assume an MCP server configured in OpenCode automatically becomes available to the production application.

For any application-level MCP integration:

- Verify the official protocol and server documentation.
- Use the minimum required permissions.
- Protect credentials and transport connections.
- Authenticate and authorize tool calls.
- Validate tool inputs and outputs.
- Require explicit approval for sensitive or irreversible actions.
- Log relevant actions without exposing secrets.
- Do not expose privileged MCP tools to public users by default.

Core website, inquiry, authentication, and client-portal features must work without MCP.

## 12. File Storage Integration

Add external file storage only when actual requirements justify it, such as client documents, project deliverables, or invoice attachments.

If file uploads are implemented:

- Use a suitable private storage provider.
- Validate file size, type, and content as appropriate.
- Generate safe object names.
- Prevent executable or malicious uploads.
- Use short-lived signed URLs or an equivalent authorized access mechanism.
- Verify user permission before granting access to a file.
- Do not rely on obscure URLs as authorization.
- Avoid storing large file contents directly in ordinary application documents without a clear reason.

Public portfolio images may use a different access policy from confidential client files.

## 13. Error Handling, Timeouts, and Reliability

Use a consistent integration error-handling strategy.

| Failure                | Expected behavior                                                    |
| ---------------------- | -------------------------------------------------------------------- |
| API unavailable        | Show a clear error and allow a safe retry                            |
| Database unavailable   | Return a controlled server error and log diagnostic details securely |
| Email provider failure | Preserve saved inquiries and retry notification safely               |
| AI provider failure    | Return a controlled error or use a suitable fallback                 |
| Payment pending        | Keep the payment pending until verified                              |
| Duplicate webhook      | Process idempotently without duplicating financial records           |
| Session expired        | Ask the user to authenticate again                                   |
| Unauthorized resource  | Deny access without exposing private data                            |
| Rate limit exceeded    | Return an appropriate response and respect retry guidance            |

Use structured server-side logs with request identifiers where appropriate. Do not log passwords, access tokens, payment secrets, or unnecessary personal information.

Retries must be bounded and appropriate to the operation.

## 14. Environment Configuration

Maintain separate environment configurations for local development, testing, staging, and production.

Possible variables include:

```dotenv
# Frontend
NEXT_PUBLIC_API_URL=

# Backend
PORT=
NODE_ENV=
FRONTEND_URL=
MONGODB_URI=

# Authentication
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# Email
EMAIL_PROVIDER_API_KEY=
EMAIL_FROM=

# Invoices and payments (Task 09)
INVOICE_SUPPORTED_CURRENCIES=BDT
INVOICE_NUMBER_PREFIX=INV
INVOICE_TIMEZONE=Asia/Dhaka
INVOICE_OVERDUE_GRACE_DAYS=0
INVOICE_TAX_ENABLED=false
INVOICE_DISCOUNT_ENABLED=false
PAYMENTS_ENABLED=true
PAYMENT_PROVIDER=FAKE
PAYMENT_ENVIRONMENT=SANDBOX
PAYMENT_WEBHOOK_SECRET=
PAYMENT_MOCK_TOKEN_SECRET=
PAYMENT_PUBLIC_BASE_URL=http://localhost:5000

# AI — add only when an AI provider is selected
AI_API_KEY=
```

These are illustrative variable names, not a guarantee that every integration uses them. Confirm the exact variables required by each selected provider and library.

Rules:

- Never commit real `.env` files or credentials.
- Provide a safe `.env.example` containing placeholders only.
- Keep secrets out of `NEXT_PUBLIC_*` variables.
- Validate required configuration at startup.
- Never print secret values in logs.
- Rotate credentials if they are accidentally exposed.
- Configure separate credentials for testing and production.

## 15. CORS, Cookies, and Deployment

Before deployment, configure the frontend and backend URLs explicitly.

Requirements:

- Allow only intended frontend origins through CORS.
- Allow credentials only when required and configured correctly.
- Never combine credentialed cross-origin requests with a wildcard origin.
- Configure cookie domain, `Secure`, `HttpOnly`, and `SameSite` settings according to the actual domain and authentication flow.
- Ensure HTTPS in production.
- Verify authentication callback and trusted-origin settings.
- Configure the payment webhook URL in the provider dashboard.
- Confirm that the backend hosting platform supports the application's runtime and connection model.
- Verify database network access and production environment variables.

Do not assume that a persistent Express server can be deployed unchanged to every serverless platform.

Test the deployed frontend-to-backend flow using production-like settings before launch.

## 16. Integration Testing

Create tests for the important connections between components.

Minimum test scenarios:

- Frontend submits a valid contact inquiry.
- Invalid input is rejected by the backend.
- Inquiry persistence is verified in the database.
- Email notification succeeds or its failure is handled safely.
- Unauthenticated requests cannot access protected resources.
- A client cannot access another client's project or invoice.
- Admin-only operations reject unauthorized roles.
- Invoice totals are calculated on the server.
- Invalid payment webhook signatures are rejected.
- Duplicate webhook events do not duplicate payments.
- AI provider failures are handled without exposing secrets.
- CORS and authentication work in the deployed environment.
- Missing configuration produces a clear, safe failure.

Use mocks for isolated automated tests and sandbox environments for provider integrations. Do not use real payment transactions or production client data in routine tests.

## 17. Recommended Integration Order

Implement and verify integrations in this order:

1. Establish frontend and backend configuration.
2. Define API contracts and a consistent error format.
3. Connect Express to MongoDB Atlas.
4. Implement and test a simple API endpoint.
5. Connect the frontend API client to the backend.
6. Implement contact inquiry persistence.
7. Integrate email notifications.
8. Verify Better Auth compatibility and integrate authentication.
9. Enforce backend role-based and object-level authorization.
10. Connect admin and client portal workflows.
11. Implement invoice management.
12. Integrate a selected payment provider.
13. Add AI functionality where it provides measurable value.
14. Add MCP and file storage only when justified.
15. Run integration tests and verify the deployed environment.

Do not proceed to a dependent integration while its prerequisite is broken.

## 18. Definition of Done

An integration is complete only when:

- Its contract and configuration are documented.
- Required credentials are stored securely.
- Input validation and error handling are implemented.
- Authentication and authorization are verified where applicable.
- Relevant automated tests pass.
- External provider behavior is tested using an appropriate sandbox or test environment.
- No secrets or sensitive records are exposed.
- Failure and retry behavior is understood.
- The implementation works in the intended deployment environment.
- Documentation is updated to reflect the actual implementation.

## 19. OpenCode Implementation Prompt

Use this prompt in OpenCode when working on integration tasks:

> Read `PRD.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `Setup.md`, `Feature Development.md`, `Authentication & Security.md`, `MCP connection.md`, and `Integration.md` before implementing an integration.
>
> Inspect the existing repository, installed package versions, environment configuration, and relevant official provider documentation. Identify dependencies and compatibility risks before editing files.
>
> Implement only the next uncompleted integration from the approved implementation plan. Define its contract, configure it securely, implement the smallest complete workflow, and test success, validation failure, authorization failure, and provider or network failure as applicable.
>
> Do not invent credentials, endpoints, package APIs, provider behavior, or test results. Do not expose secrets, weaken security controls, or introduce unnecessary dependencies. Preserve working functionality and explain any architecture change before making it.
>
> Run the relevant checks and report changed files, environment variables required, tests executed, actual results, unresolved issues, and the recommended next step. Do not claim that an integration is complete unless its acceptance criteria have been verified.

---
