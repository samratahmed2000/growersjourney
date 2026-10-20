# Deployment & Operations — Growers Journy

## 1. Purpose and scope

This document describes the **verified** deployment requirements for the
current Growers Journy codebase. It is a preparation guide, not a record of a
deployment. No production deployment, DNS change, Atlas change, or real payment
provider setup has been performed.

Two independent npm applications must be deployed:

- `client/` — Next.js 16 App Router (public site, `/admin`, `/portal`).
- `server/` — Express 5, plain JavaScript ESM, Mongoose 9, Better Auth 1.7.11.

MongoDB Atlas is the only database. The only payment adapter is the local
`FAKE` sandbox, and it is rejected in production.

> **Do not treat the application as fully production-ready until the release
> checklist in `docs/Release-Checklist.md` is complete.** Legal copy, a real
> payment provider, email delivery, client provisioning, a full CSP, and a
> verified Atlas smoke test remain unresolved.

## 2. Recommended architecture

```text
Visitor / client browser
        |
        | HTTPS
        v
Next.js site (client/)  ──────────────►  Express API (server/)
  public pages                            /api/auth/* (Better Auth)
  /admin, /portal                         /api/v1/*
  server-side reads                       /api/v1/webhooks/payments/:provider
        |                                        |
        └──────────────► MongoDB Atlas ◄─────────┘
                    (single database, one Mongoose pool in the API)
```

Recommended deployment shape:

1. **Next.js** on Vercel or any Node.js host that supports Next 16 and a custom
   build command.
2. **Express API** on a Node.js host with a long-running process, HTTPS, health
   checks, and a fixed public origin. Serverless functions are a poor fit for
   this app because it owns a Mongoose connection and a Better Auth instance.
3. **MongoDB Atlas** with a least-privilege database user, restricted network
   access, automated backups, and a separate production database.
4. Optional: put the API behind the same parent domain (`api.<domain>`) or a
   dedicated reverse proxy. Do not put credentials in the frontend.

The browser never calls the API's protected endpoints directly for page data.
Next.js rewrites `/api/v1/admin/*` and `/api/v1/portal/*` to the API and forwards
the HttpOnly session cookie. The browser calls `/api/auth/*` on the Next.js
origin, which is also rewritten. The contact form is the one browser-side
cross-origin API call, using `NEXT_PUBLIC_API_BASE_URL`.

### Why the origins matter

| Variable | Where it is read | What it must be |
| --- | --- | --- |
| `API_BASE_URL` | Next.js server only, at build/start | Full API base including `/api/v1`, e.g. `https://api.example.com/api/v1`. Never public. |
| `NEXT_PUBLIC_API_BASE_URL` | Browser bundle, inlined at build | Same API base, publicly reachable. No credentials. |
| `NEXT_PUBLIC_SITE_URL` | Metadata, canonical URLs, robots, sitemap | Public site origin, e.g. `https://example.com`. |
| `BETTER_AUTH_URL` | Express / Better Auth | Public **site** origin (where `/api/auth/*` is called), not the API port. Must be HTTPS in production. |
| `FRONTEND_URL` | Express CORS and Better Auth | Exact allowed site origin(s), comma-separated. No wildcard. |
| `PAYMENT_PUBLIC_BASE_URL` | Express payment adapter | Public **API** origin used to build webhook and mock-checkout URLs. HTTPS in production. |

Changing `API_BASE_URL` or `NEXT_PUBLIC_API_BASE_URL` requires a **rebuild** of
the Next.js app. They are read when the Next config is evaluated.

## 3. Environment variables

Use `server/.env.example` and `client/.env.example` as the authoritative
templates. Values below are placeholders; never commit real credentials.

### 3.1 Backend (`server/`)

Required at startup:

| Variable | Notes |
| --- | --- |
| `NODE_ENV` | `development`, `test`, or `production`. Must be explicit when payments are enabled. |
| `MONGODB_URI` | Atlas URI **with a database name**. Use a least-privilege user. |
| `BETTER_AUTH_SECRET` | At least 32 characters. Different per environment. Never log or expose. |
| `BETTER_AUTH_URL` | Public site origin. HTTPS in production. |
| `FRONTEND_URL` | Exact site origin(s) for CORS. |
| `PAYMENT_WEBHOOK_SECRET` | ≥32 characters whenever `PAYMENTS_ENABLED=true`. Different per environment. |
| `PAYMENT_PUBLIC_BASE_URL` | Public API origin. HTTPS in production. |

Common optional / policy settings:

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `5000` | Host platforms often inject their own `PORT`. |
| `MONGODB_TRANSACTIONS` | `true` | Atlas replica sets support transactions; a standalone local `mongod` does not. |
| `TRUST_PROXY` | `false` | Set to the number of proxy hops you control (`1`–`10`). Never `true`. |
| `INVOICE_SUPPORTED_CURRENCIES` | `BDT` | V1 is BDT-only. |
| `INVOICE_NUMBER_PREFIX` | `INV` | Invoice number prefix. |
| `INVOICE_TIMEZONE` | `Asia/Dhaka` | Used for due-date/overdue calculations. |
| `INVOICE_OVERDUE_GRACE_DAYS` | `0` | Server-side policy. |
| `INVOICE_TAX_ENABLED` | `false` | No approved tax rules; do not enable without a business decision. |
| `INVOICE_DISCOUNT_ENABLED` | `false` | Same. |
| `PAYMENTS_ENABLED` | `true` in development, `false` in production | Keep `false` in production until a real provider is approved. |
| `PAYMENT_PROVIDER` | `FAKE` | Only `FAKE` exists. Rejected in production. |
| `PAYMENT_ENVIRONMENT` | `SANDBOX` | `LIVE` is rejected with `FAKE`. |
| `PAYMENT_MOCK_TOKEN_SECRET` | falls back to webhook secret | Optional separate FAKE checkout token secret, ≥32 chars. |

Administrator provisioning only (`npm run create-admin`), not runtime:

```dotenv
ADMIN_EMAIL=...
ADMIN_NAME=...
ADMIN_PASSWORD=...   # ≥12 characters
# ALLOW_ADDITIONAL_ADMIN=true only for a deliberate second admin
```

### 3.2 Frontend (`client/`)

| Variable | Required | Notes |
| --- | --- | --- |
| `API_BASE_URL` | Yes for protected pages and rewrites | Server-only. Includes `/api/v1`. |
| `NEXT_PUBLIC_API_BASE_URL` | Yes for the contact form | Public, inlined at build. Must be reachable by browsers. |
| `NEXT_PUBLIC_SITE_URL` | Yes for production metadata | Public site origin. Local fallback is `http://localhost:3000`. |

Never put a secret behind `NEXT_PUBLIC_*`. The API base URL is public by design;
credentials are not.

## 4. MongoDB Atlas setup

1. Create separate Atlas projects/databases for development and production.
2. Create a dedicated database user with `readWrite` on the application database
   only. Do not use an Atlas administrative account.
3. Restrict network access to the API host's egress addresses where possible.
   If the platform has no fixed egress, use Atlas's supported network controls
   and document the broader access as a risk.
4. Copy the connection string, include the database name before `?`, and
   URL-encode special characters in the password.
5. Enable automated backups and, if the Atlas tier supports it, point-in-time
   recovery.
6. Run the index creation script once after the first deploy and after any model
   index change:

```bash
cd server
npm run db:indexes
```

`db:indexes` calls `createIndexes()` on each model. It is **additive** and does
not drop indexes or data. The unique `(provider, eventId)` index on
`payment_events` is required for webhook idempotency. The unique
`payments.idempotencyKey` index and the partial unique
`payments.invoiceId` index (active `INITIATED`/`PENDING` attempts only) are
required for payment-session retry and double-charge protection. If the partial
unique index cannot be created because existing data already has two active
attempts for one invoice, stop and reconcile those records manually before
retrying. If it is missing, duplicate provider events or concurrent payment
sessions may be processed more than once.

### Backup and recovery

- Use Atlas automated backups; record the retention period in the operations
  notes.
- Test a restore into a **separate** database at least once before launch, and
  periodically afterwards.
- Never restore over production without explicit owner approval and a written
  cutover plan.
- Before a risky migration, take an on-demand snapshot and record its name.
- Recovery steps:
  1. Stop or drain API traffic.
  2. Restore the chosen snapshot to a new database or cluster.
  3. Point a staging API at the restored database and run read-only smoke tests.
  4. Verify counts and a sample of invoices/payments.
  5. Only then switch the production connection string and redeploy the API.
  6. Re-run `npm run db:indexes`.
- The application has no custom migration framework. Schema changes are applied
  by Mongoose model definitions; index changes require the script above.

## 5. Build and start commands

### Frontend

```bash
cd client
npm ci
# Set API_BASE_URL, NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_SITE_URL first.
npm run lint
npm run typecheck
npm run build
npm start
```

### Backend

```bash
cd server
npm ci
npm test
npm start          # node index.js
```

Local development:

```bash
cd server && npm run dev
cd client && npm run dev
```

The API must connect to MongoDB **before** it listens. Startup exits with code 1
if configuration or the database connection fails. It never prints credentials.

## 6. Health checks and monitoring

| Endpoint | Use |
| --- | --- |
| `GET /api/v1/health` | Liveness. Deliberately DB-free. Use for process restart checks. |
| `GET /api/v1/health/ready` | Readiness. `200` when the database answers a ping; `503 DATABASE_UNAVAILABLE` otherwise. Use to gate traffic, not to restart the process. |
| `GET /` | Simple “Server is running” response. |

Configure the hosting platform to:

- Restart on liveness failure, not on a transient database readiness failure.
- Remove an instance from traffic when readiness fails.
- Send logs to a retained log destination.
- Alert on repeated `5xx`, readiness failures, webhook signature failures, and
  payment reconciliation errors.

Logs carry a request id and the request path with the query string stripped.
Bodies, headers, cookies, and query strings are never logged. Error text is
redacted before logging, but redaction is a safety net, not permission to log
secrets. Never add request-body logging for auth, payment, or client endpoints.

There is no bundled APM, metrics, or alerting integration. Add the hosting
provider's log/metrics tooling and a documented on-call contact before launch.

## 7. Security configuration

The app sets baseline security headers on the Next.js site (nosniff, frame
denial, referrer policy, permissions policy, a minimal CSP, HSTS on HTTPS) and
on every API response. The API adds HSTS only when `NODE_ENV=production`.

- The session cookie is host-only, `HttpOnly`, `SameSite=Lax`, `Path=/`, prefix
  `gj`, and `Secure` when `BETTER_AUTH_URL` is HTTPS.
- Better Auth's sign-in and `get-session` JSON still include the session token
  despite the HttpOnly cookie. No app code stores it, and no third-party scripts
  are loaded, but an XSS on the site origin could read it. A nonce-based CSP is
  **not implemented**; the current CSP is intentionally minimal.
- Rate limiting is in-memory per API process. It is not shared across multiple
  instances and resets on restart. For a multi-instance deployment, add a
  shared store (for example Redis) or enforce limits at the edge. Do not claim
  cluster-wide rate limiting without that work.
- Public inquiry submissions are limited to 5 per 15 minutes per IP.
- Do not put the API or database on a public network without TLS. Do not expose
  MongoDB Atlas directly to browsers.
- Keep `TRUST_PROXY` at the real hop count. A permissive `true` is rejected so a
  caller cannot forge `X-Forwarded-For` and reset its rate-limit bucket.

## 8. Payment operations

Only the `FAKE` sandbox exists. It moves no money, accepts no card data, and is
rejected in production.

- Keep `PAYMENTS_ENABLED=false` in production until a real provider is approved.
- Webhooks are signature-verified over the raw body and deduplicated on
  `(provider, eventId)`.
- A browser redirect is never proof of payment. Only a verified provider event
  or a provider-confirmed reconcile/refund changes the ledger.
- Refunds are provider-first. If the provider confirms a refund and the local
  transaction then fails, reconcile manually and document the case.
- Never store card numbers, CVVs, or provider secrets. No card data is accepted
  by this application.
- **Abandoned active sessions:** the app refuses to create a second active
  checkout for the same invoice/amount, and a partial unique database index
  enforces at most one active attempt per invoice. An abandoned
  `INITIATED`/`PENDING` attempt can therefore block a new attempt. There is no
  expiry/cancel UI or endpoint yet. Resolve it through a documented manual
  reconciliation process (or future provider-session expiry support); do not
  create a second checkout to bypass the guard.
- A true concurrent creation race is rejected by the unique partial index with
  `409 PAYMENT_ALREADY_STARTED`. The client should refresh and retry; the retry
  will reuse the active attempt when the amount matches.

## 9. Deployment sequence (when approved)

This is the sequence to follow **after** explicit approval. It is not permission
to deploy now.

1. Freeze changes and record the commit SHA.
2. Create/confirm the Atlas production database, least-privilege user, network
   access, and backup policy.
3. Set all backend environment variables in the hosting platform. Use a secret
   manager, not a committed file.
4. Deploy the API; confirm startup logs show no secrets and health checks pass.
5. Run `npm run db:indexes` against production.
6. Set all frontend environment variables, then build and deploy Next.js.
7. Verify `/api/v1/health`, `/api/v1/health/ready`, `/`, `/login`, `/admin`, and
   `/portal` on the deployed origins.
8. Run the smoke tests in `docs/Release-Checklist.md`.
9. Provision the first admin with `npm run create-admin` using temporary
   environment variables; remove them afterwards.
10. Monitor logs and error rates for at least one full business day.
11. Record the deployed commit, environment values (names only), backup name,
    and rollback target.

## 10. Rollback plan

1. **Frontend:** redeploy the previous known-good build/commit. Environment
   changes that affect the build require a rebuild, not just a restart.
2. **Backend:** redeploy the previous known-good commit. Keep the previous
   image/build artifact available.
3. **Database:** do not roll back data automatically. Restore a snapshot only
   with owner approval and a written plan. If a schema/index change is
   incompatible with the previous code, roll back the code first and assess data
   impact before touching the database.
4. **Configuration:** restore the previous environment values from the secret
   manager. Rotating `BETTER_AUTH_SECRET` invalidates all sessions; do it only
   deliberately.
5. **Payments:** if a payment incident occurs, disable new payment sessions
   (`PAYMENTS_ENABLED=false`), keep webhook processing available if safe, and
   reconcile from provider records. Do not mark payments successful manually.
6. **Communication:** notify the owner and affected clients through an approved
   channel. Do not invent incident details.

## 11. Unresolved deployment blockers

These are not solved by this document:

- Legal pages are draft templates pending owner/legal review. They are
  `noindex` until approved.
- No real payment provider, no production payment smoke test, no PDF invoices,
  email delivery, reminders, or notifications.
- No client invitation/provisioning flow.
- No project memberships or team-member project access.
- No automated frontend/browser tests or accessibility automation.
- No shared rate-limit store, APM, metrics, or alerting integration.
- No verified Atlas run in this environment; the finance flow has not been
  smoke-tested against a real Atlas database here.
- Public `/services` and `/work` still use static content; admin Service and
  Portfolio edits do not appear publicly.
