# AGENTS.md — Growers Journy

Digital agency platform (public site + admin dashboard + client portal) for **Growers Journy** — _Build Smarter. Grow Faster._ Founder: Samrat Ahmed.

## Repo layout and boundaries

Two **independent npm apps**, no root `package.json`, no workspaces. Install and run commands from inside each app directory.

- `client/` — Next.js 16.4.2 App Router, React 19.3, TypeScript (strict), Tailwind v4. Entry: `src/app/layout.tsx`; route groups `(public)`, `(auth)`, plus `admin/` and `portal/`. Path alias `@/*` → `./src/*`.
- `server/` — Express 5, **plain JavaScript**, ESM (`"type": "module"`), **Mongoose 9** (wraps the official `mongodb` driver, v7). Entry: `server/index.js`; supporting code in `config/` (env + database), `routes/`, `scripts/`.
- `docs/` — project specs (see doc map below). Not at the repo root, and **not** at `../docs`.
- The repo **is** a Git repository (initialized in Task 01) with a root `.gitignore`. `server/.env` is ignored — verified with `git check-ignore server/.env`. `client/.env.example` and `server/.env.example` are intentionally committed; all other `.env*` files are not.

## Commands

Client (from `client/`):

- `npm run dev` — `next dev` (Turbopack)
- `npm run build`
- `npm run lint` — runs `eslint` over the project
- `npm run typecheck` — `tsc --noEmit`
- No test script or test runner is configured for the client.

Server (from `server/`):

- `npm run dev` — `node --watch index.js`
- `npm start` — `node index.js`
- `npm test` — `node --test` (Node's built-in runner; no test dependencies). Discovers `tests/*.test.js`.
- `npm run test:watch` — `node --test --watch`
- `node scripts/check-db.js` — standalone MongoDB connectivity check; prints the database name and ping result, exits 0/1. Never prints credentials.
- `node --test tests/` does **not** work on Node 24 (the argument is treated as a module path) — use the bare `node --test` from `package.json`.

## Verified current state (do not trust docs over this)

- `npm run lint` (client) passes.
- `npm run typecheck` (client) passes.
- `npm run build` (client) passes: 28 prerendered entries. `npm run lint` is now clean; the earlier 80 typecheck errors and the failing build were caused by empty 0-byte route files, which no longer exist.
- The **public website is implemented** (Task 04): `/`, `/services`, `/work`, `/work/[slug]` (3 concepts), `/about`, `/process`, `/contact`, `/privacy-policy`, `/terms`, plus `robots.ts`, `sitemap.ts`, and branded `not-found`/`error`/`loading`.
- `src/components/` now exists: `ui/` (container, section, section-heading, page-hero, button, card, badge, icon), `layout/` (wordmark, site-header, desktop-nav, mobile-nav, site-footer), `marketing/` (hero, hero-visual, service-card, project-card, project-cover, project-filter, process-steps, differentiators, founder-note, tech-strip, faq, cta-band, contact-form, legal-page), `shared/placeholder-page`.
- Content lives in `src/lib/content/` (`site.ts`, `services.ts`, `projects.ts`, `process.ts`, `legal.ts`); domain types in `src/types/type.ts`; `cn()` in `src/lib/utils.ts`. `globals.css` now holds the `@theme` design tokens.
- **Not implemented**: authentication, admin dashboard, client portal, any backend business route, and any contact-form submission. Those 13 routes render `PlaceholderPage` with `robots: { index: false }` and are excluded in `robots.ts`. `src/features/*`, `src/lib/auth`, `src/lib/validation`, `src/hook` still do not exist.
- Portfolio content is 3 **concepts** with `isSample: true`, labelled "Concept"/"Sample concept" in the UI. There are no client names, testimonials, logos, metrics, or designed-and-delivered case studies anywhere.
- The backend works: env validation, Mongoose connection, `GET /api/v1/health`, `GET /api/v1/health/ready`, `GET /`, and the frontend↔backend link via `client/src/app/dev/health/page.tsx`.
- Task 03 is implemented and verified: `server/app.js` (`createApp`), `server/middleware/*` (request id, request logger, validate, not-found, error-handler), `server/utils/*` (`api-response`, `http-error`, `request-path`, `redact`), and `server/tests/*` — 34 tests, all passing. A consistent JSON envelope, JSON 404s, Zod validation, `100kb` body limit, and secret-safe logging with redaction are in place. No business routes exist yet, so `validate()` is only exercised by tests.
- Do not describe the unimplemented parts as "implemented".

## Client gotchas

- The duplicate `/` route was resolved in Task 01: `src/app/page.tsx` was deleted and its content moved into `src/app/(public)/page.tsx`.
- `error.tsx` must begin with `"use client"`; the global `error.tsx`/`loading.tsx`/`not-found.tsx` are now real components (Task 01). A 0-byte `error.tsx` or `loading.tsx` breaks **every** route, not just its own.
- `next.config.ts` enables `cacheComponents: true`, `partialPrefetching: true`, and `experimental.agentFeedback`. With Cache Components on, expect Suspense/async-params requirements; `client/src/app/dev/health/page.tsx` wraps its dynamic part in `<Suspense>` for this reason.
- Tailwind v4 is wired through a Turbopack rule in `next.config.ts` (`*.css` → `@tailwindcss/turbopack`). Kept as-is intentionally.
- Working dir is `src/hook/` (singular). Docs say `hooks/` — trust the filesystem.
- `tsconfig.json` includes `.next/dev/types/**` and `.next/types/**`; a stale `.next/` can surface confusing type errors — clear it before deep debugging.
- `client/.env.example` documents the server-side `API_BASE_URL` **and** the public `NEXT_PUBLIC_SITE_URL` (used for `metadataBase`, canonical URLs, `robots.txt`, and `sitemap.xml`, with a `http://localhost:3000` fallback). Copy the file to `client/.env.local`; it exists locally and is git-ignored. Never put a secret behind `NEXT_PUBLIC_*`.
- `client/src/lib/api/client.ts` is the only API helper: server-only, reads `API_BASE_URL` (never `NEXT_PUBLIC_*`) and returns a result object instead of throwing.
- Design tokens live in `@theme` inside `src/app/globals.css` (`brand-950/900/800/700`, `accent-500/600`, `canvas`, `surface`, `ink`, `muted`, `line`). Components use those utilities instead of hex values. Display font variable is `--font-inter` (it was misnamed `--font-geist-sans` before Task 04).
- **Contrast rule** (measured, see the note in `globals.css`): `#16A36A` (accent-500) on white is ≈3.2:1 and fails WCAG AA for normal text, so it is only used for large text on dark, icons, borders, and focus accents. `#0F7048` (accent-600) is the interactive accent — ≈6.1:1 with white text and ≈5.7:1 as text on the canvas background — so links, eyebrows, badges, and accent buttons use it. Primary buttons are `brand-900` (≈12.3:1 with white). All 24 text/graphic pairs used on the site were checked and meet their target.
- Only four Client Components exist on the public site: `layout/desktop-nav.tsx`, `layout/mobile-nav.tsx` (both need `usePathname`), `marketing/project-filter.tsx`, and `marketing/contact-form.tsx`. Everything else is a Server Component. The mobile menu is a disclosure panel, not a modal, so it needs no focus trap.
- `/work/[slug]` uses `generateStaticParams` + `notFound()`. **`export const dynamicParams` fails the build** with `cacheComponents: true` ("Route segment config dynamicParams is not compatible"). Because the response shell streams before `notFound()` runs, unknown slugs would otherwise return HTTP 200 with a `noindex` tag. `src/proxy.ts` (the Next 16 rename of middleware) rewrites unknown `/work/*` slugs to `/_not-found`, which returns a real 404; it is scoped by `config.matcher` so no other route pays for it.
- The global `loading.tsx` creates a Suspense boundary for every route, which is what starts streaming (and fixes the status code at 200) — relevant if a future task needs a real non-200 status from a page.

## Server gotchas

- `server/.env` exists and holds real DB credentials. Never read it out, print it, commit it, or add it to a diff. Only variable **names** belong in a `.env.example`. It currently contains only `DB_USER` / `DB_PASS`; the code now requires `MONGODB_URI`, so **the server will exit at startup until `MONGODB_URI` is added** (see `server/.env.example` for the full URI, including the database name).
- Configuration lives in `server/config/env.js` (the only place `dotenv` is loaded and `process.env` is read) and is validated on import. Missing or malformed variables print the **variable names only** and `process.exit(1)`. Never log values.
- The MongoDB connection is owned solely by `server/config/database.js` (`connectDatabase(uri)`, `pingDatabase`, `disconnectDatabase`, `getDatabaseState`). **`connectDatabase` takes the URI as an argument** and no longer imports `config/env.js`; `index.js` and `scripts/check-db.js` pass `env.mongodbUri`. That is deliberate: `config/env.js` calls `process.exit(1)` when configuration is missing, so importing it from the HTTP layer would make `createApp()` untestable without a database. `server/index.js` still connects **before** `app.listen()`, so the server does not accept requests without a database. Connection failures exit 1 with a generic message; the URI and driver error payloads are never logged. The old `console.log(client)` leak is gone.
- `server/app.js` exports `createApp({ allowedOrigins, jsonLimit = "100kb", logRequests = true })` and must **not** import `config/env.js`. Middleware order is load-bearing: request id → request logger → cors → `express.json({ limit })` → `/api/v1` routers → `GET /` → not-found → error handler (4 args, last). `app.disable("x-powered-by")` is intentional.
- All responses go through `server/utils/api-response.js` (`sendSuccess` / `sendError`). Error `details` is only included when it is a non-empty array. Deliberate failures are raised as `HttpError` (`server/utils/http-error.js`); anything else becomes a generic `500 INTERNAL_ERROR`.
- **No stack trace is ever sent to a client, in any environment** (`NODE_ENV` defaults to `development`, so "production-only" protection would have been meaningless). Server-side logs carry the request id; that is where diagnostics belong.
- The logger logs `req.originalUrl` (query string stripped) rather than `req.path`, because Express strips the mount prefix while a mounted router handles the request — using `req.path` there logs `/health` instead of `/api/v1/health`. Use `server/utils/request-path.js`. Never log bodies, headers, cookies, or query strings (`tests/logging.test.js` guards this).
- Error text is **redacted before it is logged**. `server/utils/redact.js` (`redactText`) masks credentials in URLs, `Bearer`/`Basic` values, `key=value`/`key: value` forms, and JWTs, then truncates to 4000 characters. The error handler passes `error.message` and `error.stack` through it, because a dependency's message can embed a connection string or key. This is a safety net, not permission to log secrets — still never pass bodies, headers, or credentials to a logger.
- `server/tests/helpers/server.js` starts the app on port `0` with `logRequests: false` and calls `server.closeAllConnections()` before closing (Node's fetch keeps connections alive, which would otherwise stall `server.close()`). Name files `*.test.js`; do **not** name a helper `test-*.js`, or the runner will try to run it as a suite.
- Health endpoints: `GET /api/v1/health` (liveness, deliberately DB-free) and `GET /api/v1/health/ready` (readiness; `200` when the database answers a ping, `503 DATABASE_UNAVAILABLE` otherwise). `GET /` still returns `"Server is running"`.
- CORS is restricted to the origins in `FRONTEND_URL` (comma-separated, defaults to `http://localhost:3000`) instead of the previous wide-open `app.use(cors())`.
- `SIGINT`/`SIGTERM` trigger a graceful shutdown (stop listening → close the connection → exit 0, with a 10s watchdog). Note that on Windows an OS-level `SIGTERM` cannot be delivered to Node, so only the `SIGINT` path is directly testable there.
- Top-level `await` is used at module scope; keep ESM syntax and don't convert to `require`.

## Planned stack vs installed (do not assume)

Docs describe a future target. Installed on the server today: Express, `cors`, `dotenv`, **Mongoose 9**, **Zod 4**. Tests use Node's built-in runner, so there is no test dependency at all. Installed on the client today: `next`, `react`, `react-dom`, and **`lucide-react` 1.59** (icons only; no shadcn/ui, Radix, clsx, or tailwind-merge — `cn()` is hand-written in `src/lib/utils.ts`). Still **not installed anywhere**: TypeScript on the server, Better Auth, shadcn/ui, React Hook Form, Jest/Vitest/Supertest/Playwright. Verify in `package.json` before importing or documenting a library. Introducing one is a deliberate decision — confirm with the owner first.

## Project rules to keep

- Docs live in `docs/`: `PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `Setup.md`, `Project-Implementation.md`, `Project-Structure.md`, `Testing-QA.md`, `Authentication-Security.md`, `Feature-Development.md`, `Integration.md`, `MCP-Connection.md`, `Debbuging.md` (filename is misspelled — use it exactly). Read the relevant one before architectural changes; the phased plan and quality gates live in `Project-Implementation.md` and `Testing-QA.md`.
- Brand: exact name **Growers Journy**, tagline **Build Smarter. Grow Faster.**, primary green `#123C2D`, accent green `#16A36A`. Never add an arrow to the GJ logo.
- Never fabricate testimonials, client logos, ratings, metrics, or project outcomes. Use clearly labeled placeholders.
- Security is server-side: authenticated + authorized on every protected endpoint; never trust client-supplied roles, user IDs, ownership fields, or payment status. Deny by default.
- Financial values (invoice totals, payment state) are computed/verified on the server; webhooks must be signature-verified and idempotent. A browser redirect is never proof of payment.
- Keep secrets out of `NEXT_PUBLIC_*` and out of logs/error responses. No stack traces or internal error messages in any response.
- Validate untrusted input on the server; do not expose raw DB documents or unrestricted Mongo query objects.
- Never seed production with fake business or payment data.

## Working style

Preserve existing files and unrelated work; make small, focused changes; verify with the commands above and state honestly which ones fail and why. Explain decisions in beginner-friendly language — the owner is deliberately building full-stack skills and wants reasoning, not unexplained code dumps.
