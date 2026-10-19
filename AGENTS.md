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
- No test script or test runner is configured anywhere.

Server (from `server/`):

- `npm run dev` — `node --watch index.js`
- `npm start` — `node index.js`
- `node scripts/check-db.js` — standalone MongoDB connectivity check; prints the database name and ping result, exits 0/1. Never prints credentials.
- `npm test` is still the npm-init stub that always exits 1.

## Verified current state (do not trust docs over this)

- `npm run lint` (client) passes.
- `npm run build` (client) **fails**: TypeScript reports ~20 empty route files as "not a module" (see below).
- `npm run typecheck` (client) **fails** for the same reason: ~20 files under `src/app/` are still empty 0-byte placeholders, so Next's generated validators report them as "not a module". The count was 25 before Task 01 filled `error.tsx`, `loading.tsx`, `not-found.tsx`, and `(public)/page.tsx`.
- Most pages are still empty placeholders: `(auth)/login`, `(public)/{about,contact,privacy-policy,process,services,terms,work/[slug]}`, all 8 `admin/*`, all 4 `portal/*`, `robots.ts`, `sitemap.ts`, `src/lib/utils.ts`, `src/types/type.ts`. `src/components/*`, `src/features/*`, `src/lib/auth`, `src/lib/validation`, `src/hook` do not exist yet. `globals.css` is only `@import "tailwindcss";`.
- The backend works: env validation, Mongoose connection, `GET /api/v1/health`, `GET /api/v1/health/ready`, `GET /`, and the frontend↔backend link via `client/src/app/dev/health/page.tsx`.
- Do not describe the unimplemented parts as "implemented".

## Client gotchas

- The duplicate `/` route was resolved in Task 01: `src/app/page.tsx` was deleted and its content moved into `src/app/(public)/page.tsx`.
- `error.tsx` must begin with `"use client"`; the global `error.tsx`/`loading.tsx`/`not-found.tsx` are now real components (Task 01). A 0-byte `error.tsx` or `loading.tsx` breaks **every** route, not just its own.
- `next.config.ts` enables `cacheComponents: true`, `partialPrefetching: true`, and `experimental.agentFeedback`. With Cache Components on, expect Suspense/async-params requirements; `client/src/app/dev/health/page.tsx` wraps its dynamic part in `<Suspense>` for this reason.
- Tailwind v4 is wired through a Turbopack rule in `next.config.ts` (`*.css` → `@tailwindcss/turbopack`). Kept as-is intentionally.
- Working dir is `src/hook/` (singular). Docs say `hooks/` — trust the filesystem.
- `tsconfig.json` includes `.next/dev/types/**` and `.next/types/**`; a stale `.next/` can surface confusing type errors — clear it before deep debugging.
- `client/.env.example` documents the single server-side variable `API_BASE_URL`; copy it to `client/.env.local` for local development. `client/.env.local` exists locally and is git-ignored.
- `client/src/lib/api/client.ts` is the only API helper: server-only, reads `API_BASE_URL` (never `NEXT_PUBLIC_*`) and returns a result object instead of throwing.

## Server gotchas

- `server/.env` exists and holds real DB credentials. Never read it out, print it, commit it, or add it to a diff. Only variable **names** belong in a `.env.example`. It currently contains only `DB_USER` / `DB_PASS`; the code now requires `MONGODB_URI`, so **the server will exit at startup until `MONGODB_URI` is added** (see `server/.env.example` for the full URI, including the database name).
- Configuration lives in `server/config/env.js` (the only place `dotenv` is loaded and `process.env` is read) and is validated on import. Missing or malformed variables print the **variable names only** and `process.exit(1)`. Never log values.
- The MongoDB connection is owned solely by `server/config/database.js` (`connectDatabase`, `pingDatabase`, `disconnectDatabase`, `getDatabaseState`). `server/index.js` connects **before** `app.listen()`, so the server does not accept requests without a database. Connection failures exit 1 with a generic message; the URI and driver error payloads are never logged. The old `console.log(client)` leak is gone.
- Health endpoints: `GET /api/v1/health` (liveness, deliberately DB-free) and `GET /api/v1/health/ready` (readiness; `200` when the database answers a ping, `503 DATABASE_UNAVAILABLE` otherwise). `GET /` still returns `"Server is running"`.
- CORS is restricted to the origins in `FRONTEND_URL` (comma-separated, defaults to `http://localhost:3000`) instead of the previous wide-open `app.use(cors())`.
- `SIGINT`/`SIGTERM` trigger a graceful shutdown (stop listening → close the connection → exit 0, with a 10s watchdog). Note that on Windows an OS-level `SIGTERM` cannot be delivered to Node, so only the `SIGINT` path is directly testable there.
- Top-level `await` is used at module scope; keep ESM syntax and don't convert to `require`.

## Planned stack vs installed (do not assume)

Docs describe a future target. Installed on the server today: Express, `cors`, `dotenv`, **Mongoose 9**. Still **not installed anywhere**: TypeScript/Zod on the server, Better Auth, shadcn/ui, Lucide, React Hook Form, any test framework. Verify in `package.json` before importing or documenting a library. Introducing one is a deliberate decision — confirm with the owner first.

## Project rules to keep

- Docs live in `docs/`: `PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `Setup.md`, `Project-Implementation.md`, `Project-Structure.md`, `Testing-QA.md`, `Authentication-Security.md`, `Feature-Development.md`, `Integration.md`, `MCP-Connection.md`, `Debbuging.md` (filename is misspelled — use it exactly). Read the relevant one before architectural changes; the phased plan and quality gates live in `Project-Implementation.md` and `Testing-QA.md`.
- Brand: exact name **Growers Journy**, tagline **Build Smarter. Grow Faster.**, primary green `#123C2D`, accent green `#16A36A`. Never add an arrow to the GJ logo.
- Never fabricate testimonials, client logos, ratings, metrics, or project outcomes. Use clearly labeled placeholders.
- Security is server-side: authenticated + authorized on every protected endpoint; never trust client-supplied roles, user IDs, ownership fields, or payment status. Deny by default.
- Financial values (invoice totals, payment state) are computed/verified on the server; webhooks must be signature-verified and idempotent. A browser redirect is never proof of payment.
- Keep secrets out of `NEXT_PUBLIC_*` and out of logs/error responses. No stack traces in production.
- Validate untrusted input on the server; do not expose raw DB documents or unrestricted Mongo query objects.
- Never seed production with fake business or payment data.

## Working style

Preserve existing files and unrelated work; make small, focused changes; verify with the commands above and state honestly which ones fail and why. Explain decisions in beginner-friendly language — the owner is deliberately building full-stack skills and wants reasoning, not unexplained code dumps.
