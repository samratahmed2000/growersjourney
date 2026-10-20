# Setup Guide — Growers Journy

## 1. Purpose

This guide explains how to run the **current** Growers Journy repository
locally. It replaces earlier planned wording that described a TypeScript backend
and `frontend/`/`backend/` folders. The actual applications are `client/` and
`server/`.

**Project:** Growers Journy  
**Tagline:** Build Smarter. Grow Faster.  
**Frontend:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4
**Backend:** Node.js, Express 5, **plain JavaScript ESM**, Mongoose 9
**Database:** MongoDB Atlas
**Authentication:** Better Auth 1.7.11 with the official MongoDB adapter
**Payments:** Local `FAKE` sandbox only (no real provider)

No production seed data, real card data, or invented credentials belong in this
repository.

## 2. Prerequisites

- Node.js `>=20.9.0` (verified on Node 24; do not upgrade dependencies without
  checking compatibility)
- npm (both apps have their own `package-lock.json`)
- Git
- A MongoDB Atlas database, or a local MongoDB for development
- VS Code / OpenCode (optional but recommended)

There is **no root `package.json`** and no workspace. Run commands inside
`client/` or `server/`.

## 3. Repository layout

```text
growers-journy/
├── client/     # Next.js public site, admin, portal
├── server/     # Express API, auth, finance, tests
├── docs/       # product, architecture, API, security, deployment
├── AGENTS.md
└── README.md
```

Read `AGENTS.md` first. It records the current verified state and the known
gotchas that the older design documents may not reflect.

## 4. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

Use `npm ci` when you want a reproducible install from the lockfiles.

## 5. Configure the backend

```bash
cd server
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Fill in at least:

- `NODE_ENV=development`
- `MONGODB_URI` — Atlas URI **including the database name**
- `BETTER_AUTH_SECRET` — at least 32 random characters
- `BETTER_AUTH_URL=http://localhost:3000`
- `FRONTEND_URL=http://localhost:3000`
- `PAYMENTS_ENABLED=true` and `PAYMENT_PROVIDER=FAKE` for the local sandbox
- `PAYMENT_WEBHOOK_SECRET` — at least 32 random characters when payments are on
- `PAYMENT_PUBLIC_BASE_URL=http://localhost:5000`

`server/.env.example` documents every variable, including `TRUST_PROXY`,
invoice settings, and administrator provisioning. Never commit `.env`. The
config loader prints variable **names only** when something is missing or
malformed; it never prints values.

### Why `NODE_ENV` matters

When `PAYMENTS_ENABLED=true`, startup requires an explicit `NODE_ENV`. This
prevents a development FAKE sandbox from being mistaken for production.
`PAYMENT_PROVIDER=FAKE` is always rejected when `NODE_ENV=production`.

### MongoDB Atlas

1. Create a project and database deployment.
2. Create a dedicated database user with `readWrite` on this database only.
3. Restrict network access as narrowly as your environment allows.
4. Copy the connection string and include the database name before `?`.
5. URL-encode special characters in the password.

Standalone local MongoDB does not support transactions. If you use one, set
`MONGODB_TRANSACTIONS=false`. Atlas replica sets support transactions, so keep
the default `true` there.

### Connect and create indexes

```bash
cd server
node scripts/check-db.js
npm run db:indexes
```

`check-db.js` prints the database name and ping result, then exits `0` or `1`.
`db:indexes` calls `createIndexes()` on every model. It is additive and does not
drop indexes or data. The unique `(provider, eventId)` index on `payment_events`
is required for webhook idempotency.

## 6. Configure the frontend

```bash
cd client
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Set:

- `API_BASE_URL=http://localhost:5000/api/v1` — server-only
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1` — public, used by the
  contact form; inlined at build time
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000` — public site URL for metadata,
  robots, and sitemap

`API_BASE_URL` is also used by `next.config.ts` to derive the rewrite origin for
`/api/auth/*`, `/api/v1/admin/*`, and `/api/v1/portal/*`. If you change it,
restart the dev server; for a production build, rebuild the app.

Never put a database URL, API key, auth secret, or webhook secret behind
`NEXT_PUBLIC_*`.

## 7. Run the applications

Terminal 1:

```bash
cd server
npm run dev
```

Terminal 2:

```bash
cd client
npm run dev
```

Open `http://localhost:3000`.

Quick checks:

- API liveness: `http://localhost:5000/api/v1/health`
- API readiness (requires MongoDB): `http://localhost:5000/api/v1/health/ready`
- Development-only backend status page: `http://localhost:3000/dev/health`
  (returns 404 in production)

## 8. Create the first administrator

There is no public sign-up. Provision the first `ADMIN` with temporary shell
variables:

```bash
cd server
# PowerShell:
$env:ADMIN_EMAIL="you@example.com"
$env:ADMIN_NAME="Your Name"
$env:ADMIN_PASSWORD="a-long-unique-password-at-least-12-characters"
npm run create-admin

# macOS/Linux:
ADMIN_EMAIL=you@example.com \
ADMIN_NAME="Your Name" \
ADMIN_PASSWORD="a-long-unique-password-at-least-12-characters" \
npm run create-admin
```

The script never prints the password. Remove the temporary variables from your
shell afterwards. A second admin is refused unless `ALLOW_ADDITIONAL_ADMIN=true`.

To give a client portal access, create/link the `Client` record from
`/admin/clients` and link an existing `CLIENT` account. There is no client
invitation or self-service provisioning flow yet.

## 9. Run the checks

### Backend

```bash
cd server
npm test
npm audit --omit=dev --audit-level=high
```

Tests use Node's built-in runner and in-memory/injected repositories, so they do
not require MongoDB. Use the npm script; `node --test tests/` does not work on
Node 24.

### Frontend

```bash
cd client
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev --audit-level=high
```

There is no frontend unit/component/E2E test runner configured. Do not claim
those checks passed.

## 10. Local payment sandbox

The only implemented provider is `FAKE`:

- It moves no real money.
- It accepts no card data.
- It is rejected in production.
- Its mock checkout is mounted only for `FAKE`.
- A browser redirect is never proof of payment; the signed webhook is.

To run without payments, set `PAYMENTS_ENABLED=false`. Invoice/admin CRUD still
works, while payment creation, webhook, refund, and reconcile paths return
`503 PAYMENTS_DISABLED`.

## 11. Troubleshooting

### The server exits immediately

The message names the missing/invalid variable. Check `server/.env` and the
required list in `server/.env.example`. Do not paste the value into a chat or
issue. If `PAYMENTS_ENABLED=true`, confirm `NODE_ENV` is explicit.

### `MONGODB_URI` is rejected

Include a database name before `?`. URL-encode special characters in the
password. Use `node scripts/check-db.js` to isolate connectivity.

### Auth login works but protected pages redirect

`BETTER_AUTH_URL` must be the public **site** origin, not the API port. The
browser calls `/api/auth/*` on the Next.js origin, and Next rewrites it to the
API. Also confirm `FRONTEND_URL` contains that exact origin.

### Contact form fails

`NEXT_PUBLIC_API_BASE_URL` is inlined at build time. Set it before `npm run
build`, confirm the API is reachable from the browser, and confirm the site
origin is in `FRONTEND_URL` for CORS.

### Type errors after pulling changes

A stale `.next/` can surface confusing types. Stop the dev server, remove
`.next/`, and re-run `npm run typecheck`. Do not delete source files to silence
errors.

### Payment webhook returns 401/400

The webhook verifies an HMAC over the raw request body. It must be mounted before
`express.json()`; the app already does this. Confirm `PAYMENT_WEBHOOK_SECRET`
matches the provider and that the provider signs the exact raw payload. Never
disable signature verification to make a webhook pass.

### Index errors or duplicate webhook processing

Run `npm run db:indexes` against the target database. The script never drops
data. Check the unique indexes on `payments.idempotencyKey` and
`payment_events.(provider, eventId)`.

## 12. What is not set up

- No real payment provider, email delivery, notifications, or PDF generation.
- No client invitation/provisioning flow.
- No project memberships or team-member project access.
- No frontend/browser/accessibility automation.
- No shared rate-limit store or APM/metrics integration.
- Legal pages are draft templates and are `noindex` until approved.

For deployment preparation, see `docs/Deployment.md` and
`docs/Release-Checklist.md`.
