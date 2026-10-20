# Setup Guide — Growers Journy

## 1. Purpose

This document explains how to prepare the development environment, configure the frontend and backend, connect MongoDB Atlas, and run the Growers Journy application locally.

**Project:** Growers Journy  
**Tagline:** Build Smarter. Grow Faster.  
**Frontend:** Next.js, React, TypeScript, Tailwind CSS  
**Backend:** Node.js, Express.js, TypeScript  
**Database:** MongoDB Atlas with Mongoose  
**Authentication:** Better Auth, subject to compatibility verification  
**Development environment:** VS Code and OpenCode

Follow the steps in order. Do not assume the repository is empty or overwrite an existing configuration.

## 2. Prerequisites

Install the following tools before starting.

- **Node.js:** Use a version supported by the repository's dependencies.
- **Package manager:** Use the one specified by the existing lockfile and project configuration.
- **Git:** For source control.
- **VS Code:** Primary code editor.
- **OpenCode:** AI-assisted development tool configured in the terminal.
- **MongoDB Atlas:** Database service for development and production.
- **Browser:** For frontend testing.

Optional services such as email, payment processing, and AI providers can be configured when their corresponding features are implemented.

## 3. Verify the Installed Tools

Open a terminal in VS Code and run:

```bash
node --version
npm --version
git --version
```

If the project uses another package manager, verify its installed version as well.

Then inspect:

- Root and application-level `package.json` files.
- Lockfiles and workspace configuration.
- Existing TypeScript and Next.js configuration.
- Available scripts.
- Existing environment templates.
- Git status and current changes.

**Important:** Do not upgrade Node.js or replace the package manager automatically. First confirm compatibility with the current project.

## 4. Open the Project in VS Code

Open the repository root folder in VS Code.

Example terminal command:

```bash
code .
```

If the `code` command is unavailable, open VS Code manually and select the repository folder.

Read these files before making changes:

1. `AGENTS.md`
2. `PRD.md`
3. `DESIGN.md`
4. `ARCHITECTURE.md`
5. `DATABASE.md`
6. `API.md`
7. `README.md`
8. `Project Implementation.md`

Check the actual filenames and paths first. If a document is missing, report that fact rather than inventing its contents.

## 5. Prepare the Repository

The planned repository structure is:

```text
growers-journy/
├── frontend/
├── backend/
├── docs/
├── .gitignore
├── AGENTS.md
└── README.md
```

This is a proposed structure, not a command to recreate the repository.

If the project already has a working structure, preserve it unless there is a clear reason to change it.

### Initial checks

- Confirm whether the frontend already exists.
- Confirm whether the backend already exists.
- Identify the correct installation directory for each application.
- Check whether dependencies are already installed.
- Check whether the repository contains uncommitted user changes.
- Confirm which application scripts are available.

Do not initialize a second Git repository inside an existing repository.

## 6. Install Dependencies

Use the repository's package manager and workspace configuration.

For a separately configured npm frontend:

```bash
cd frontend
npm install
```

For a separately configured npm backend:

```bash
cd ../backend
npm install
```

These commands are examples. Adapt them if the project uses a root workspace or another package manager.

Prefer the appropriate lockfile-based installation command for reproducible builds when dependencies are already defined.

Do not install a dependency merely because it appears in this document. Check whether it is already installed, whether it is needed, and whether it is compatible with the current application.

## 7. Configure MongoDB Atlas

### Step 1 — Create a database deployment

Create or select a MongoDB Atlas project and database deployment.

### Step 2 — Create a database user

Create a dedicated database user with only the permissions needed by the application.

Do not use an administrative database account as the application's ordinary runtime account.

### Step 3 — Configure network access

Allow connections from the intended development environment using an appropriate network-access configuration.

Avoid unrestricted network access in production. Never publish database credentials in documentation, source code, screenshots, or public repositories.

### Step 4 — Obtain the connection string

Copy the connection string supplied by MongoDB Atlas and place it in the backend's local environment file.

The database name and connection-string format should match the project's actual configuration.

### Step 5 — Verify connectivity

Run the backend using its configured development script and confirm that:

- Required environment variables are present.
- The database connection succeeds.
- Connection errors are reported clearly.
- Sensitive connection details are not printed in logs.

The current backend loads `MONGODB_URI` from the server environment and validates it at startup. A missing or malformed value stops the process immediately with a message that names the variable only — never its value.

Two checks are available:

- `node scripts/check-db.js` — a standalone connectivity check that prints the database name and ping result, then exits `0` or `1`. This is the quickest way to isolate a database problem.
- `GET /api/v1/health/ready` — readiness for a running server. It returns `200` when the database answers a ping and `503 DATABASE_UNAVAILABLE` when it does not. `GET /api/v1/health` (liveness) deliberately stays `200` during a database outage and does not check the database.

Do not continue with database-dependent features until connectivity is verified.

## 8. Environment Variables

Use separate environment files for the frontend and backend when the repository uses separate applications.

Example layout:

```text
frontend/
├── .env.local
└── .env.example

backend/
├── .env
└── .env.example
```

The exact file names depend on the existing configuration.

### Frontend configuration

Typical variables may include:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

Use this example only if the backend actually listens on port `5000` and exposes the API at `/api/v1`. Otherwise, change it to match the implementation.

Only values intended to be visible in browser code may use the `NEXT_PUBLIC_` prefix.

### Backend configuration

Create a template similar to the following and adapt it to the implemented configuration:

```dotenv
NODE_ENV=development
PORT=5000
MONGODB_URI=
MONGODB_TRANSACTIONS=true
FRONTEND_URL=http://localhost:3000
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
TRUST_PROXY=false
```

Notes:

- `MONGODB_URI` must include the database name before `?`.
- `BETTER_AUTH_SECRET` is server-only, at least 32 characters. Generate it with `openssl rand -base64 32`. Never reuse it across environments.
- `BETTER_AUTH_URL` is the **public frontend origin**, not the API port. The Next.js rewrite sends `/api/auth/*` to Express.
- `MONGODB_TRANSACTIONS=false` only for a standalone local MongoDB; Atlas supports transactions.
- `TRUST_PROXY` is `false` directly, or the number of proxy hops you control. `true` is rejected.

Additional variables will be required for email, payment, AI, and logging integrations.

Document every required variable in the backend's environment template without adding real credentials.

### Environment security rules

- Never commit `.env`, `.env.local`, or other files containing real secrets.
- Keep environment templates free of private values.
- Validate required variables during server startup.
- Never expose MongoDB, authentication, email, payment, or AI secrets to frontend code.
- Use separate credentials for development and production.
- If a secret is exposed, rotate it promptly.

## 9. Configure Authentication

Better Auth **1.7.11** is installed and runs in the Express server. The official `@better-auth/mongo-adapter@1.7.11` uses the existing MongoDB connection. Next.js serves the login UI and rewrites same-origin `/api/auth/*` requests to Express; it does not validate sessions itself.

Setup steps:

1. Run `npm install` in `server/` and `client/`. The server needs `better-auth` and `@better-auth/mongo-adapter`; the client needs no auth SDK because it calls the relative `/api/auth/*` path.
2. Copy `server/.env.example` to `server/.env` and fill in `MONGODB_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `FRONTEND_URL`. Use `http://localhost:3000` for `BETTER_AUTH_URL` in development.
3. Make sure `client/.env.local` has `API_BASE_URL=http://localhost:5000/api/v1`. `next.config.ts` derives the API origin for the `/api/auth` rewrite from it, and the protected layouts call `${API_BASE_URL}/auth/me` server-side.
4. Start the server, then create the first administrator from `server/`:

   ```bash
   ADMIN_EMAIL=you@example.com ADMIN_NAME="Your Name" \
   ADMIN_PASSWORD="a long unique password" npm run create-admin
   ```

   On PowerShell, set `$env:ADMIN_EMAIL`, `$env:ADMIN_NAME`, and `$env:ADMIN_PASSWORD` for the single command. The script refuses a second `ADMIN` unless `ALLOW_ADDITIONAL_ADMIN=true` is set, and it never prints the password.
5. Remove the `ADMIN_*` variables from the shell after provisioning.
6. Start Next.js, open `/login`, and sign in. `ADMIN` and `TEAM_MEMBER` land in `/admin`; `CLIENT` lands in `/portal`.
7. Verify the backend independently: `GET /api/v1/auth/me` without a cookie must return `401`, and `/admin/access` or `/portal/access` must return `403` for the wrong role.

Security reminders:

- There is no public sign-up endpoint. `emailAndPassword.disableSignUp` is `true`, and the admin-plugin `role` field is not writable through the profile API.
- Passwords are hashed by Better Auth with scrypt; nothing in this project stores or logs plaintext passwords.
- Password reset/recovery is **not** implemented because it needs email delivery, which is outside this phase. Do not add a custom reset endpoint.
- The session cookie is `HttpOnly`, `SameSite=Lax`, host-only, and `Secure` on HTTPS. Never store the session token in `localStorage` or `sessionStorage`.
- Do not assume a protected Next.js page protects the Express API. Express re-validates every protected request.

## 10. Start the Backend

Open a terminal in the backend application directory.

Inspect its `package.json` and identify the actual development script.

If a `dev` script exists, start it using the configured package manager. For npm, the command may be:

```bash
npm run dev
```

Confirm that the server starts successfully and that its configured health endpoint responds.

Do not invent a health endpoint or assume a particular port before checking the implementation.

If startup fails, inspect the first meaningful error, environment validation, dependency installation, and database connectivity before changing code.

## 11. Start the Frontend

Open another terminal in the frontend application directory.

Inspect its `package.json` for the development script.

If it defines a `dev` script, the npm command may be:

```bash
npm run dev
```

Open the local URL printed by the development server.

Verify that:

- The homepage loads.
- Navigation works.
- Static assets load correctly.
- The API base URL matches the backend.
- API failures produce useful error states.
- No private credentials appear in browser-visible configuration.

The frontend and backend should run in separate terminals unless the repository already provides a verified combined development command.

## 12. Verify the Full Application

After both applications start:

- [ ] Frontend opens successfully.
- [ ] Backend starts without configuration errors.
- [ ] Health endpoint responds, if implemented.
- [ ] MongoDB connection succeeds.
- [ ] Public service and portfolio endpoints work, if implemented.
- [ ] Contact form validation works.
- [ ] Invalid API requests are rejected safely.
- [ ] Protected endpoints reject unauthenticated requests.
- [ ] Unauthorized roles cannot perform restricted actions.
- [ ] Browser console and server logs contain no critical errors.
- [ ] Responsive layouts work on mobile and desktop.

Mark only verified items as complete.

## 13. Configure Optional Integrations

Configure these integrations only when their features are ready for implementation.

### Email provider

- Add server-side credentials.
- Verify sender-domain and delivery requirements.
- Test successful delivery and provider failure.
- Ensure failed email delivery does not silently discard saved inquiries.

### Payment provider

- Select a provider appropriate for the intended business and region.
- Configure server-side credentials and webhook secrets.
- Verify webhook signatures.
- Handle duplicate events safely.
- Never mark an invoice as paid solely because the browser reports success.

### AI provider

- Configure the selected provider's server-side credentials.
- Define permitted use cases and access boundaries.
- Apply usage limits and error handling.
- Avoid exposing private client data unnecessarily.

### MCP integrations

- Identify a real workflow before adding MCP.
- Use narrowly scoped permissions.
- Keep credentials server-side.
- Require approval for consequential actions.
- Do not expose internal tools to unauthenticated public users.

## 14. Common Setup Problems

| Problem                         | What to check                                                   |
| ------------------------------- | --------------------------------------------------------------- |
| `node` or `npm` not found       | Installation and terminal PATH                                  |
| Dependency installation fails   | Node.js compatibility, lockfile, network, package manager       |
| Frontend cannot reach API       | Backend status, base URL, CORS, port                            |
| MongoDB connection fails        | URI, credentials, network access, database permissions          |
| Missing environment variable    | Correct environment file and variable name                      |
| Authentication fails            | Trusted origins, session configuration, adapter compatibility   |
| Port already in use             | Identify the existing process before changing ports             |
| TypeScript or build errors      | Exact error message, package versions, configuration            |
| OpenCode edits unexpected files | Review repository instructions and Git diff; stop risky changes |

Do not delete lockfiles, reset the repository, disable security controls, or remove dependencies as a first response to a setup problem.

## 15. Git Safety

Before and after setup changes, inspect:

```bash
git status
git diff
```

Commit only intentional changes.

Never commit real environment files, access tokens, database credentials, payment secrets, or private client records.

Do not discard existing user changes to make the repository appear clean.

## 16. OpenCode Setup Instructions

When using OpenCode to configure the project:

1. Ask it to inspect the repository and read `AGENTS.md`.
2. Request an audit of the current setup before modifications.
3. Ask it to identify missing configuration and explain why each change is needed.
4. Implement one setup task at a time.
5. Run the actual available verification commands.
6. Review changed files and command results.
7. Ask it to explain any new configuration in beginner-friendly language.

Example instruction:

> Read `AGENTS.md`, `README.md`, and `Project Implementation.md`. Inspect the existing repository without modifying files first. Report the frontend and backend structure, package manager, available scripts, environment-variable requirements, database configuration status, and any setup blockers. Do not expose secrets or perform destructive operations. After the audit, propose the smallest safe setup plan and wait for approval before making substantial changes.

## 17. Setup Completion Criteria

Setup is complete when:

- [ ] The repository structure is understood.
- [ ] Required dependencies are installed.
- [ ] Environment files are configured locally.
- [ ] Frontend starts successfully.
- [ ] Backend starts successfully.
- [ ] Database connectivity is verified.
- [ ] API communication works where implemented.
- [ ] Secrets are excluded from version control.
- [ ] Remaining integration requirements are documented.
- [ ] Actual verification results are recorded.

**Final principle:** Inspect first, configure carefully, verify each step, and preserve existing work.
