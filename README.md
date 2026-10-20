# Growers Journy — README

**Build Smarter. Grow Faster.**

Growers Journy is a technology agency focused on Web Application Development,
Business Automation, and AI Integration. This repository contains the public
agency website, an admin dashboard, a client portal, and the Express API behind
them.

> **Project status:** In development — Task 10 production-readiness work is in
> progress. The application is **not** fully production-ready; see
> `docs/Release-Checklist.md` for unresolved blockers.
>
> **Founder:** Samrat Ahmed

## 1. What is implemented

### Public website (`client/`)

- `/`, `/services`, `/work`, `/work/[slug]`, `/about`, `/process`, `/contact`,
  `/privacy-policy`, `/terms`
- Branded `not-found`, `error`, and `loading` states
- `robots.ts`, `sitemap.ts`, and a proxy that returns real 404s for unknown
  project slugs
- Contact form backed by the Express API (server-side validation, rate limiting,
  and MongoDB storage)
- Portfolio content is **three concepts** labelled “Concept” / “Sample concept”.
  There are no client names, testimonials, logos, metrics, or invented outcomes.

### Admin dashboard (`/admin`, `ADMIN` only)

- Overview, inquiries, clients, projects, services, and portfolio management
- Project milestones, client-visible updates, and explicit portal-account linking
- Invoices, payments, refunds, reconciliation, and print layouts
- Strict server-side validation and archive/restore instead of hard delete

### Client portal (`/portal`, `CLIENT` only)

- Dashboard, projects, milestones, client-visible updates
- Invoices, payment history, and a sandbox checkout result page
- Every query is scoped to the active `Client` linked to the signed-in user

### Backend (`server/`)

- Express 5, plain JavaScript ESM, Mongoose 9, Zod 4
- Better Auth 1.7.11 with the official MongoDB adapter
- Health endpoints, consistent JSON envelopes, request ids, redacted logs,
  security headers, and a 404/error handler
- Finance services with server-calculated totals, an append-only payment ledger,
  signed webhooks, and duplicate-event handling
- A provider-independent `FAKE` sandbox checkout. **No real payment provider is
  implemented.**

## 2. Repository layout

```text
growers-journy/
├── client/                 # Next.js 16 App Router, React 19, TypeScript, Tailwind v4
│   └── src/
│       ├── app/            # (public), (auth), admin/, portal/
│       ├── components/     # ui, layout, marketing, admin, portal, auth, shared
│       └── lib/            # content, api, auth, admin helpers
├── server/                 # Express 5, plain JavaScript ESM, Mongoose 9
│   ├── auth/               # Better Auth setup, roles, access control
│   ├── models/             # Mongoose models
│   ├── repositories/       # data access
│   ├── routes/             # public, admin, portal, webhooks, mock payments
│   ├── services/           # invoice and payment business logic
│   ├── tests/              # node:test suites
│   └── scripts/            # check-db, create-admin, sync-indexes
├── docs/                   # product, architecture, API, security, deployment
├── AGENTS.md
└── README.md
```

There is **no root `package.json` and no workspace**. Install and run commands
inside `client/` or `server/`.

## 3. Technology actually installed

| Area | Installed today |
| --- | --- |
| Frontend | Next.js 16.4.2, React 19.3, TypeScript (strict), Tailwind CSS v4 |
| Icons | `lucide-react` |
| Backend | Node.js, Express 5, plain JavaScript ESM |
| Database | MongoDB Atlas, Mongoose 9 |
| Validation | Zod 4 |
| Authentication | Better Auth 1.7.11 + `@better-auth/mongo-adapter` 1.7.11 |
| Backend tests | Node's built-in `node --test` (no Jest/Vitest/Supertest) |
| Frontend tests | None configured |
| Payments | Local `FAKE` sandbox adapter only |

Not installed: shadcn/ui, Radix, clsx, tailwind-merge, React Hook Form,
Jest/Vitest/Supertest/Playwright, any payment SDK, any PDF or decimal library.
`cn()` is hand-written in `client/src/lib/utils.ts`. Introducing a new library
is a deliberate decision; check `package.json` first.

## 4. Local development

### Prerequisites

- Node.js `>=20.9.0` (the repo was verified on Node 24)
- npm
- A MongoDB Atlas database (or a local MongoDB with transactions disabled)

### Backend

```bash
cd server
npm install
copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux
# Fill in MONGODB_URI, BETTER_AUTH_SECRET, BETTER_AUTH_URL.
npm run dev
```

The API listens on `http://localhost:5000` by default. It validates configuration
at startup and exits if required values are missing. **Never commit
`server/.env`.** When payments are enabled, `NODE_ENV` must be set explicitly;
the development default in `.env.example` is `NODE_ENV=development`.

After the database is reachable, create indexes once:

```bash
npm run db:indexes
```

### Frontend

```bash
cd client
npm install
copy .env.example .env.local   # Windows
# cp .env.example .env.local   # macOS/Linux
npm run dev
```

The site runs on `http://localhost:3000`. `API_BASE_URL` is server-only;
`NEXT_PUBLIC_API_BASE_URL` is public and is used by the contact form. Set both
before building.

### First administrator

```bash
cd server
# Set ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD (>=12 chars) in the shell.
npm run create-admin
```

The script creates an `ADMIN` through Better Auth, never prints the password, and
refuses a second admin unless `ALLOW_ADDITIONAL_ADMIN=true`.

## 5. Commands

### Client (`cd client`)

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

### Server (`cd server`)

| Command | Purpose |
| --- | --- |
| `npm run dev` | `node --watch index.js` |
| `npm start` | `node index.js` |
| `npm test` | `node --test` |
| `npm run test:watch` | Watch mode |
| `npm run create-admin` | Provision the first admin |
| `npm run db:indexes` | Create missing model indexes (additive) |
| `node scripts/check-db.js` | Standalone MongoDB connectivity check |

Do not run `node --test tests/` on Node 24; the argument is treated as a module
path. Use the npm script.

## 6. Security model (summary)

- Authentication and authorization are enforced by Express on every protected
  request. Next.js page guards are not the security boundary.
- `ADMIN` is required for `/api/v1/admin/*`; `CLIENT` plus an active linked
  `Client` is required for `/api/v1/portal/*`. `TEAM_MEMBER` has no admin or
  portal access today.
- Writes also require a trusted `Origin`; session cookies are `HttpOnly`,
  `SameSite=Lax`, host-only, and `Secure` on HTTPS.
- Invoice totals and payment status are never accepted from the browser. Only a
  signature-verified provider event or a provider-confirmed refund/reconcile
  changes the ledger.
- Payment webhooks verify an HMAC over the raw body and deduplicate on
  `(provider, eventId)`.
- Public inquiries are rate-limited and use a strict schema; the honeypot returns
  a normal success response and stores nothing.
- Secrets stay out of `NEXT_PUBLIC_*`, logs, error responses, and Git. Error
  responses never include stack traces.
- Baseline security headers are set on the site and API. A full nonce-based CSP
  is **not** implemented.

## 7. Documentation map

| File | Purpose |
| --- | --- |
| `docs/PRD.md` | Product requirements |
| `docs/DESIGN.md` | Visual direction and design system |
| `docs/ARCHITECTURE.md` | System architecture and boundaries |
| `docs/DATABASE.md` | Data models, relationships, indexes |
| `docs/API.md` | API endpoints and access rules |
| `docs/Authentication-Security.md` | Auth and security controls |
| `docs/Setup.md` | Local setup and environment variables |
| `docs/Testing-QA.md` | Test strategy and verification |
| `docs/Deployment.md` | Deployment, operations, backups, rollback |
| `docs/Release-Checklist.md` | Production release gates |
| `docs/Project-Implementation.md` | Phased implementation status |
| `docs/Debbuging.md` | Troubleshooting (filename is intentionally spelled this way) |

## 8. Known limitations / not implemented

- Legal pages are draft templates pending owner/legal review; they are `noindex`
  until approved.
- No real payment provider, production payment smoke test, PDF invoices, email
  delivery, reminders, or notifications.
- No client invitation/provisioning flow.
- No project memberships or team-member project access.
- No automated frontend/browser or accessibility tests.
- Rate limiting is in-memory per API process; it is not shared across instances.
- Public `/services` and `/work` still use static content; admin Service and
  Portfolio edits do not appear publicly.
- Real Atlas persistence has not been smoke-tested in this development
  environment.
- Better Auth's JSON still includes the session token despite the HttpOnly
  cookie; a nonce-based CSP is not implemented.

See `docs/Release-Checklist.md` before any deployment.
