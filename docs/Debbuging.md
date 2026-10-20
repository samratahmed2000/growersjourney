# Debugging Guide — Growers Journy

## 1. Purpose

This document defines the debugging workflow for the Growers Journy agency website and management platform.

The goal is to identify root causes, implement minimal and safe fixes, verify the results, and prevent regressions.

The application includes:

- Next.js frontend.
- Node.js and Express.js backend.
- MongoDB Atlas and Mongoose.
- Better Auth, subject to verified compatibility.
- REST API integrations.
- Admin dashboard and client portal.
- Email and payment integrations.
- AI services and optional MCP tools.

**Core principle:** Do not guess, randomly change code, or suppress errors. Reproduce the issue, investigate the evidence, identify the root cause, and verify the fix.

## 2. Standard Debugging Workflow

Follow this workflow for every bug.

### Step 1: Understand the problem

Identify:

- What is failing?
- What should happen?
- What actually happens?
- When did the issue start?
- Is it reproducible?
- Does it affect the frontend, backend, database, authentication, or an external provider?

Ask for missing information only when necessary.

### Step 2: Reproduce the issue

Use the same steps, inputs, and environment that trigger the failure.

Record the relevant error message, stack trace, browser console output, network response, or backend logs.

Never assume that an error has been reproduced simply because the code appears suspicious.

### Step 3: Inspect the evidence

Inspect the relevant:

- Source files and imports.
- Package versions and configuration.
- Environment variable names and availability.
- API requests and responses.
- Server logs.
- Database schema and query behavior.
- Authentication session and authorization checks.
- Recent code changes, if available.

Use the actual repository structure and installed package versions.

### Step 4: Identify the root cause

Determine the earliest confirmed point where the expected behavior diverges from the actual behavior.

Separate confirmed facts from hypotheses.

If several causes are possible, test them systematically rather than changing multiple unrelated files at once.

### Step 5: Implement a minimal fix

- Fix the underlying cause.
- Preserve existing behavior outside the affected area.
- Avoid unnecessary dependencies.
- Avoid broad refactoring during a focused bug fix.
- Preserve validation and security controls.
- Explain any architecture changes before making them.

### Step 6: Verify the fix

Run the smallest relevant reproduction first, then the appropriate tests.

Check for:

- Successful behavior.
- Invalid input.
- Failure conditions.
- Related workflows.
- Regressions.
- Lint, type-check, and build failures where applicable.

### Step 7: Report the result

Summarize:

- Root cause.
- Files changed.
- Fix implemented.
- Commands and tests executed.
- Actual results.
- Remaining risks or unresolved issues.

Never report an unverified fix as complete.

## 3. Next.js and React Debugging

### Common issues

- Build failures.
- Hydration mismatches.
- Missing environment variables.
- Incorrect imports or module paths.
- Client/server component boundary errors.
- Data-fetching failures.
- Infinite rendering or repeated requests.
- Incorrect loading and error states.
- Image configuration errors.
- Dependency or version conflicts.

### Debugging procedure

1. Read the complete error message and relevant stack trace.
2. Identify the component, route, or module involved.
3. Determine whether the code runs on the server or client.
4. Inspect the data passed to the failing component.
5. Check whether browser-only APIs are used during server rendering.
6. Verify imports, configuration, and installed package versions.
7. Reproduce the problem after the smallest change.

### Hydration mismatches

Investigate differences between server-rendered HTML and the initial client render.

Check for:

- Browser-dependent values used during rendering.
- Time-dependent or random output.
- Inconsistent server and client data.
- Invalid HTML nesting.
- Incorrectly initialized state.
- Theme or locale differences.

Do not silence hydration warnings without identifying the cause.

### Client/server component boundaries

In the Next.js App Router:

- Keep server-only secrets and privileged data access on the server.
- Use client components only where browser interaction or client-side state requires them.
- Do not import server-only modules into client components.
- Verify the correct use of asynchronous server components and data-fetching patterns for the installed Next.js version.

Do not add `"use client"` to an entire application simply to resolve one component error.

### Build failures

Inspect:

- The first meaningful error in the build output.
- TypeScript errors.
- Missing modules.
- Incorrect environment configuration.
- Invalid route exports.
- Server/client boundary violations.
- Dependency compatibility.

Do not disable TypeScript or lint checks just to make the build pass.

## 4. TypeScript Debugging

When a type error occurs:

1. Read the complete diagnostic.
2. Identify the expected and actual types.
3. Trace where the value originates.
4. Check whether API responses, optional values, or database records are typed correctly.
5. Fix the type or validation at the appropriate boundary.

Prefer accurate types, discriminated unions, and runtime validation.

Avoid:

- Widespread use of `any`.
- Unnecessary type assertions.
- Non-null assertions that hide real uncertainty.
- Casting invalid external data into trusted application types.

Remember that TypeScript types alone do not validate data received from an API or external service at runtime.

## 5. Express.js and API Debugging

### Common issues

- Route returns 404.
- API returns 400, 401, 403, or 500 unexpectedly.
- Middleware executes in the wrong order.
- Request body is undefined.
- Validation behaves inconsistently.
- Async errors are not handled.
- CORS blocks browser requests.
- API response shape differs from the frontend contract.
- Rate limiting blocks legitimate requests.

### Debugging procedure

1. Confirm the backend process is running.
2. Verify the actual port and API base URL.
3. Confirm the route is registered.
4. Check the HTTP method and request path.
5. Inspect middleware order.
6. Verify JSON parsing and content type.
7. Inspect server-side validation.
8. Trace the controller and service calls.
9. Check database and external-provider errors.
10. Compare the response against `API.md`.

Use a REST client or suitable automated API tests to isolate backend failures from frontend problems.

### HTTP status interpretation

| Status      | Investigate                                 |
| ----------- | ------------------------------------------- |
| 400         | Invalid request or failed validation        |
| 401         | Missing, invalid, or expired authentication |
| 403         | Insufficient permissions                    |
| 404         | Incorrect route or nonexistent resource     |
| 409         | Conflict, such as a duplicate record        |
| 429         | Rate limiting                               |
| 500         | Unexpected server failure                   |
| 502/503/504 | Upstream, availability, or timeout issues   |

Use the status that matches the actual failure. Do not convert every error into a generic 500 response.

## 6. MongoDB Atlas and Mongoose Debugging

### Common issues

- Connection failure.
- Authentication failure.
- IP access restrictions.
- Incorrect connection string.
- Missing environment variables.
- Schema validation errors.
- Duplicate-key errors.
- Unexpected empty query results.
- Invalid ObjectId errors.
- Slow queries.
- Connection exhaustion.

### Debugging procedure

1. Confirm that the server has the expected environment variable.
2. Verify the connection string format without exposing its credentials.
3. Check Atlas network access and database user permissions.
4. Confirm that the correct database and collection are being used.
5. Inspect the Mongoose schema and model.
6. Verify the query filter and input identifiers.
7. Inspect validation and duplicate-key errors.
8. Check indexes and query performance when relevant.

Never print the complete MongoDB connection string in logs.

### Connection failures

Check network connectivity, database availability, credentials, access rules, and connection configuration.

Do not repeatedly create new database connections for individual requests.

### Missing records

Check:

- Whether the write operation succeeded.
- Whether the correct database is selected.
- Whether the query uses the expected field and value.
- Whether filters accidentally exclude the record.
- Whether the current user is authorized to see it.

Do not remove authorization filters just to make a query return data.

## 7. Authentication and Authorization Debugging

Authentication problems must be investigated without weakening security.

### Common issues

- Login fails unexpectedly.
- Sessions are not recognized by the API.
- Cookies are missing.
- Protected pages redirect incorrectly.
- Admin access is denied.
- A client cannot see their own project.
- Cross-origin authentication fails.

### Debugging procedure

1. Verify the authentication provider's configuration and installed version.
2. Confirm the login response and session creation behavior.
3. Inspect browser cookie presence and applicable cookie attributes without copying sensitive values.
4. Verify frontend and backend origins.
5. Confirm the documented session-validation method.
6. Check the user's assigned role.
7. Inspect backend authorization and resource ownership checks.
8. Test with isolated accounts representing each role.

Do not assume that successful login in Next.js automatically authenticates an Express API request.

Never fix a permission issue by allowing all authenticated users to access all resources.

Do not log passwords, session tokens, or authentication secrets.

## 8. Frontend–Backend Integration Debugging

When a page does not display data:

1. Inspect the browser Network panel.
2. Identify the exact failing request.
3. Verify the request URL, method, headers, and payload.
4. Check the API response status and sanitized response body.
5. Inspect backend logs using the corresponding request identifier when available.
6. Verify the database result.
7. Check whether the frontend parses the response correctly.
8. Confirm loading, empty, and error states behave as intended.

Investigate the first failing layer rather than randomly modifying the UI and backend simultaneously.

### CORS errors

Check:

- The actual requesting origin.
- Allowed origins in the backend configuration.
- Credential settings.
- Preflight request handling.
- Cookie configuration when authentication depends on cookies.

Do not use permissive production CORS settings as a shortcut.

## 9. Environment and Configuration Debugging

Common symptoms include:

- API URL is undefined.
- Database connection fails.
- Authentication callback fails.
- Email provider rejects a request.
- Payment webhooks do not arrive.
- Production works differently from local development.

Check:

1. Whether the required variable exists.
2. Whether it is loaded by the correct application.
3. Whether its name matches the integration code.
4. Whether it is available in the deployed environment.
5. Whether a restart or redeployment is required.
6. Whether the value is appropriate for the current environment.

Keep separate configurations for development, testing, and production.

Never place server secrets in `NEXT_PUBLIC_*` variables.

Do not paste real credentials into chat, source files, screenshots, or logs.

## 10. Email, Payment, and AI Debugging

### Email

Check provider configuration, verified sender identity, request validation, provider response, delivery events, and retry behavior.

If an inquiry has been saved but email delivery fails, preserve the inquiry and investigate notification recovery.

Do not create a duplicate inquiry merely to retry a notification.

### Payments

Check:

- Provider sandbox configuration.
- Payment creation request.
- Server-calculated invoice amount.
- Webhook endpoint availability.
- Signature verification.
- Event identifiers and idempotency.
- Transaction state transitions.
- Invoice balance calculation.

Never mark an invoice paid merely because the browser shows a success page.

Do not disable webhook signature verification to troubleshoot a failed event.

### AI integrations

Check provider availability, model configuration, request format, input limits, usage quotas, timeout behavior, and response parsing.

Do not expose provider credentials or send unnecessary private client data while debugging.

If the AI provider is unavailable, preserve the availability of unrelated core application features.

### MCP integrations

Check the actual MCP client configuration, server availability, permissions, protocol compatibility, and tool schemas.

Distinguish development MCP used by OpenCode from MCP features intentionally deployed in the application.

Do not grant broader permissions simply to make a tool call succeed.

## 10.1 Current repository-specific failures

### Server exits at startup

The config loader names the missing or malformed variable and exits 1. Check
`server/.env` against `server/.env.example`. If `PAYMENTS_ENABLED=true`,
`NODE_ENV` must be set explicitly. Never paste secret values into logs, chat, or
issues.

### MongoDB connection or index errors

Run `cd server && node scripts/check-db.js`. Confirm the URI includes a database
name and that the password is URL-encoded. Run `npm run db:indexes` to create
missing indexes; it never drops data. The unique `(provider, eventId)` index is
required for webhook idempotency.

### Login works but protected pages redirect

`BETTER_AUTH_URL` is the public **site** origin, not the API port. The browser
calls `/api/auth/*` on Next.js, which rewrites to Express. `FRONTEND_URL` must
contain that exact site origin for CORS/Better Auth.

### Contact form fails while the API is healthy

`NEXT_PUBLIC_API_BASE_URL` is inlined at build time. Set it before building,
confirm the browser can reach it, and confirm the site origin is in
`FRONTEND_URL`. A server-side `API_BASE_URL` alone is not enough for the contact
form.

### Payment session returns `409 PAYMENT_ALREADY_PENDING`

An active `INITIATED`/`PENDING` payment exists for the invoice and the requested
amount differs from it. Complete or reconcile the existing attempt; do not create
a second checkout to bypass the guard. If a session was genuinely abandoned,
document the operational handling before changing state manually.

### Webhook returns 401/400

The handler verifies an HMAC over the raw body. It must run before
`express.json()`, and the secret must match the provider. Never disable signature
verification to make a webhook pass. Duplicate events return `200` with
`duplicate: true` and must credit nothing.

### `npm run build` type errors after pulling

Remove the stale `.next/` directory and re-run `npm run typecheck`. Do not delete
route files to silence errors; empty route files break every route.

## 11. Performance and Memory Debugging

When the application becomes slow or crashes:

1. Identify whether the issue occurs in the frontend, backend, database, or external provider.
2. Inspect logs and resource usage.
3. Reproduce the issue under controlled conditions.
4. Check for repeated requests, unbounded loops, large data structures, and inefficient queries.
5. Inspect connection and resource cleanup.
6. Profile before introducing optimizations.
7. Verify that the fix resolves the measured bottleneck.

For JavaScript heap or memory errors, investigate:

- Very large imported datasets.
- Excessive parallel processing.
- Memory leaks.
- Unbounded caching.
- Repeated object creation.
- Build-time memory pressure.
- Dependency or bundler issues.

Increasing the memory limit may help diagnose or temporarily mitigate a problem, but it does not prove that the root cause has been fixed.

## 12. Safe Debugging Tools

Use tools appropriate to the repository:

- Browser developer tools.
- VS Code debugger.
- Node.js debugging facilities.
- Existing application logs.
- REST clients.
- MongoDB Atlas monitoring and query tools.
- Unit and integration tests.
- Git diff and commit history.
- Package manager diagnostics.

Before using a command that deletes files, resets data, changes dependencies, or rewrites configuration, understand its consequences.

Never run destructive commands against production data.

Do not delete lockfiles, reinstall every dependency, or clear the database as a first troubleshooting step.

## 13. Git and Regression Prevention

Before editing:

1. Inspect `git status`.
2. Review relevant recent changes.
3. Identify unrelated user modifications.
4. Preserve existing work.

After editing:

1. Review `git diff`.
2. Remove accidental changes and debugging leftovers.
3. Run focused tests.
4. Run broader checks where appropriate.
5. Add a regression test for an important reproducible bug.
6. Report exactly what changed.

Do not overwrite user changes, reset the repository, or create a commit unless requested or explicitly authorized by the current workflow.

## 14. Severity and Prioritization

Prioritize issues according to their impact.

- **Critical:** Unauthorized access, exposed secrets, payment integrity failures, serious data corruption, or complete production outage.
- **High:** Major user journeys are broken, authentication is unusable, or key records cannot be accessed.
- **Medium:** A noncritical feature fails or has a practical workaround.
- **Low:** Minor visual defects or low-impact usability issues.

Treat severity as a starting point. Assess the actual impact and escalate security-sensitive issues promptly.

## 15. Definition of Done

A bug fix is complete only when:

- The problem has been reproduced or the available evidence is sufficient to diagnose it.
- The root cause is supported by evidence.
- The fix addresses that cause.
- Relevant tests have been executed.
- Regression risks have been checked.
- Security controls remain intact.
- The code diff has been reviewed.
- Actual test results are documented.
- Any remaining limitations are clearly stated.

## 16. OpenCode Debugging Prompt

Use this prompt when asking OpenCode to debug the project:

> Read the relevant project documentation, especially `PRD.md`, `ARCHITECTURE.md`, `API.md`, `Authentication & Security.md`, `Integration.md`, `Testing & QA.md`, and `Debugging.md`.
>
> Inspect the repository, relevant source files, package versions, configuration, logs, and available tests before making changes.
>
> First reproduce the issue or establish the strongest available evidence. Trace the failing behavior through the relevant components, API, authentication, database, or external integration. Identify confirmed facts, possible causes, and the root cause before editing.
>
> Implement the smallest safe fix. Preserve existing functionality, user changes, and security controls. Do not introduce unnecessary dependencies, suppress errors, invent missing environment values, disable tests, or rewrite unrelated files.
>
> Add or update a regression test when appropriate. Execute the relevant tests and checks that actually exist in the project. If a check cannot run, explain why.
>
> Report the issue, root cause, changed files, fix, commands executed, actual results, remaining risks, and recommended next step. Do not claim success without verification.

---
