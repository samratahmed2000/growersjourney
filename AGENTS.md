# AGENTS.md — Growers Journy

Digital agency platform (public site + admin dashboard + client portal) for **Growers Journy** — _Build Smarter. Grow Faster._ Founder: Samrat Ahmed.

## Repo layout and boundaries

Two **independent npm apps**, no root `package.json`, no workspaces. Install and run commands from inside each app directory.

- `client/` — Next.js 16.4.2 App Router, React 19.3, TypeScript (strict), Tailwind v4. Entry: `src/app/layout.tsx`; route groups `(public)`, `(auth)`, plus `admin/` and `portal/`. Path alias `@/*` → `./src/*`.
- `server/` — Express 5, **plain JavaScript**, ESM (`"type": "module"`), native `mongodb` driver. Single entry: `server/index.js`.
- `docs/` — project specs (see doc map below). Not at the repo root, and **not** at `../docs`.
- The repo is **not** a Git repository yet, and the root has no root `.gitignore`. If you initialize Git, first add ignore rules for `server/.env`, `node_modules/`, `.next/`.

## Commands

Client (from `client/`):

- `npm run dev` — `next dev` (Turbopack)
- `npm run build`
- `npm run lint` — runs `eslint` over the project
- Typecheck: `npx tsc --noEmit` (no `typecheck` script exists)
- No test script or test runner is configured anywhere.

Server (from `server/`):

- `node index.js` — **there is no `dev`/`start` script**; `npm test` is the npm-init stub that always exits 1.

## Verified current state (do not trust docs over this)

- `npm run lint` (client) passes.
- `npm run build` (client) **fails**: `src/app/error.tsx` "must be a Client Component" — it is a 0-byte placeholder.
- `npx tsc --noEmit` (client) **fails** because ~25 files under `src/app/` are empty 0-byte files, so Next's generated validators report them as "not a module".
- Almost all pages are empty placeholders. `src/components/*`, `src/features/*`, `src/lib/api`, `src/lib/auth`, `src/lib/validation`, `src/hook`, `src/types/type.ts`, `src/lib/utils.ts` are empty directories/files. `globals.css` is only `@import "tailwindcss";`.
- Do not describe these as "implemented".

## Client gotchas

- `src/app/page.tsx` and `src/app/(public)/page.tsx` both resolve to `/`. Resolve this duplicate root route before adding more root-level routes.
- `error.tsx` must begin with `"use client"`; filling in the empty global `error.tsx`/`loading.tsx`/`not-found.tsx` is usually the first thing that unblocks build/typecheck.
- `next.config.ts` enables `cacheComponents: true`, `partialPrefetching: true`, and `experimental.agentFeedback`. With Cache Components on, expect Suspense/async-params requirements; don't add client-side data fetching by reflex.
- Tailwind v4 is wired through a Turbopack rule in `next.config.ts` (`*.css` → `@tailwindcss/turbopack`). Kept as-is intentionally.
- Working dir is `src/hook/` (singular). Docs say `hooks/` — trust the filesystem.
- `tsconfig.json` includes `.next/dev/types/**` and `.next/types/**`; a stale `.next/` can surface confusing type errors — clear it before deep debugging.
- `client/.env.example` exists but is **empty**; no API base URL is configured anywhere yet.

## Server gotchas

- `server/.env` exists and holds real DB credentials. Never read it out, print it, commit it, or add it to a diff. Only variable **names** belong in a `.env.example`.
- `index.js` reads `DB_USER` / `DB_PASS` and hardcodes the Atlas cluster host. `docs/Setup.md` documents `MONGODB_URI` instead — the docs are wrong; match the code or migrate deliberately.
- `index.js` calls `console.log(client)` after connecting, which can leak connection details into logs. Prefer removing/redacting that when touching the file.
- Only route implemented is `GET /` → `"Server is running"` on `PORT || 5000`. There is no `/api/v1`, no health check, no auth, no validation.
- CORS is wide open (`app.use(cors())`). Lock it to configured origins before any credentialed/private endpoint.
- Top-level `await` is used at module scope; keep ESM syntax and don't convert to `require`.

## Planned stack vs installed (do not assume)

Docs describe a future target. Currently **not installed anywhere**: TypeScript/Zod/Mongoose on the server, Better Auth, shadcn/ui, Lucide, React Hook Form, any test framework. Verify in `package.json` before importing or documenting a library. Introducing one is a deliberate decision — confirm with the owner first.

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
