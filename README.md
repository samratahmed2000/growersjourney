# Growers Journy — README

**Build Smarter. Grow Faster.**

Growers Journy is a technology agency focused on Web Application Development, Business Automation, and AI Integration. This project aims to build a premium agency website and a secure management platform for handling leads, clients, projects, invoices, and business workflows.

> **Project status:** In Development  
> **Founder:** Samrat Ahmed  
> **Professional role:** AI-Driven Web Application Engineer (MERN)

---

## 1. Project Overview

Growers Journy will provide a professional digital presence for the agency and a private platform for managing its operations.

The application includes three main areas:

1. **Public Website** — services, portfolio, agency information, and contact forms.
2. **Admin Dashboard** — lead management, client records, projects, portfolio content, and invoicing.
3. **Client Portal** — authorized project updates, milestones, invoices, and relevant documents.

The implementation must remain beginner-friendly to develop while following professional architecture and production-oriented security practices.

## 2. Core Services

- **Web Application Development:** Modern, responsive, full-stack web applications.
- **Business Automation:** Digital workflows and repetitive-task automation.
- **AI Integration:** Practical AI-powered features and integrations for business applications.

## 3. Key Features

### Public Website

- Premium, responsive, mobile-first interface.
- Service listings and service details.
- Dynamic portfolio and project case studies.
- About, development process, contact, FAQ, and legal pages.
- Inquiry form with server-side validation.
- Search-engine optimization and accessible UI.
- Genuine testimonials and verified project information only.

### Admin Dashboard

- Overview of agency activity.
- Lead and inquiry management.
- Client and project management.
- Milestones, updates, and task-related workflows.
- Dynamic services and portfolio management.
- Invoice creation and payment-status tracking.
- Role-based access for authorized administrators and team members.
- Audit logs for important administrative actions.

### Client Portal

- Secure client sign-in.
- Access restricted to the authenticated client's own authorized records.
- Project progress and milestone visibility.
- Project updates and relevant documents.
- Invoice and payment-status access.
- Notifications where implemented.

### Automation and AI

- Email notifications for relevant events.
- AI integration foundation for selected business workflows.
- Controlled MCP integrations when a real use case requires them.
- Usage tracking, error handling, and configurable provider integrations.

## 4. Technology Stack

| Area                 | Technology                                                             |
| -------------------- | ---------------------------------------------------------------------- |
| Frontend             | Next.js App Router, React, TypeScript                                  |
| Styling              | Tailwind CSS                                                           |
| UI components        | shadcn/ui, Lucide                                                      |
| Backend API          | Node.js, Express.js, TypeScript                                        |
| Database             | MongoDB Atlas                                                          |
| Database modeling    | Mongoose                                                               |
| Authentication       | Better Auth, subject to adapter and backend compatibility verification |
| API validation       | Zod or an equivalent validated schema approach                         |
| Frontend deployment  | Vercel or a compatible host                                            |
| Backend deployment   | A Node.js-compatible hosting platform                                  |
| Development workflow | VS Code and OpenCode                                                   |

Use the existing project configuration and lockfile as the source of truth. Do not install duplicate frameworks or replace working dependencies without a clear reason.

## 5. Architecture Overview

The application is planned as a frontend and backend API monorepo.

```text
growers-journy/
├── frontend/          # Next.js public website and private dashboards
├── backend/           # Express REST API
├── docs/              # Additional project documentation, if adopted
├── .gitignore
├── README.md
└── AGENTS.md
```

The actual directory structure must be checked against the repository before implementation. Existing files should be preserved unless a deliberate change is approved.

### Request flow

```text
Browser
   |
   v
Next.js Frontend
   |
   v
Express REST API
   |
   v
Validation + Authentication + Authorization
   |
   v
Business Services
   |
   v
MongoDB Atlas
```

External services such as email, payment providers, and AI providers must be integrated through controlled server-side modules. Secret credentials must never be exposed to browser code.

## 6. Documentation Guide

Read these documents before making architectural or feature-level changes.

| File              | Purpose                                   |
| ----------------- | ----------------------------------------- |
| `PRD.md`          | Product requirements and project scope    |
| `DESIGN.md`       | Visual direction, design system, and UX   |
| `ARCHITECTURE.md` | System architecture and module boundaries |
| `DATABASE.md`     | Data models, relationships, and indexes   |
| `API.md`          | API endpoints and access rules            |
| `AGENTS.md`       | Instructions for AI coding agents         |
| `README.md`       | Project overview and setup                |

Keep additional implementation and operations documents consistent with these specifications.

## 7. Prerequisites

Install and configure the following before starting development:

- Node.js version compatible with the repository and its dependencies.
- The package manager indicated by the existing lockfile.
- Git and a GitHub repository.
- VS Code with OpenCode configured.
- A MongoDB Atlas project and database credentials.
- Authentication configuration after compatibility has been verified.
- Email provider credentials for notification functionality.
- Payment provider credentials only when payment processing is implemented.
- AI provider credentials only when AI features are enabled.

Do not assume a particular Node.js version or package manager without inspecting the project configuration.

## 8. Local Development Setup

### Step 1: Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd growers-journy
```

Replace the placeholder with the actual repository URL.

### Step 2: Inspect the project

Before installing dependencies, check:

- The root directory and existing application folders.
- `package.json` files and their scripts.
- The package-manager lockfile.
- Existing `.env.example` files.
- The versions of installed dependencies.
- The implementation status of the frontend and backend.

### Step 3: Install dependencies

Use the package manager and commands appropriate to each existing application. For example, if the project uses npm:

```bash
cd frontend
npm install
```

For a separately configured backend:

```bash
cd ../backend
npm install
```

These commands are examples. Follow the repository's actual package manager, workspace configuration, and lockfile.

### Step 4: Configure environment variables

Create local environment files using the actual variable names documented by each application.

Typical configuration categories include:

**Frontend**

- Public API base URL.
- Public application URL, if required.
- Other explicitly browser-safe settings.

**Backend**

- Application environment and port.
- MongoDB connection string.
- Authentication secrets and trusted origins.
- Email provider credentials.
- Payment provider credentials and webhook secrets.
- AI provider credentials, when enabled.

Use `.env.example` to document required variables with placeholder values. Never commit real secrets or production credentials.

### Step 5: Start development servers

Inspect the scripts in each `package.json` before running commands.

If the relevant applications define a `dev` script, the commands may look like:

```bash
npm run dev
```

Run the command from the correct application directory. Start the frontend and backend separately unless the repository already provides a root-level development command.

### Step 6: Verify the application

- Confirm that the frontend loads.
- Confirm that the backend health endpoint responds, if implemented.
- Verify database connectivity without exposing credentials.
- Check browser and server logs for errors.
- Test a public inquiry using valid and invalid input.
- Verify access restrictions before testing admin or client features.

## 9. Environment and Secret Management

- Keep local environment files out of version control.
- Commit only safe environment templates.
- Validate required environment variables at server startup.
- Keep database, authentication, payment, email, and AI secrets on the server.
- Never expose private secrets through `NEXT_PUBLIC_` variables.
- Use separate credentials for local development and production.
- Rotate credentials if they are accidentally exposed.

## 10. Security Requirements

Security is a core requirement, not a final-stage enhancement.

- Validate incoming data on the server.
- Authenticate protected requests and enforce server-side role-based access control.
- Verify ownership and permissions for every client-specific resource.
- Never allow users to assign themselves administrative roles.
- Rate-limit public inquiry and authentication endpoints.
- Protect against spam, injection, unsafe file uploads, and unauthorized access.
- Use secure session and cookie configuration appropriate to the deployment.
- Verify payment webhook signatures and prevent duplicate event processing.
- Calculate invoice totals and financial values on the server.
- Keep audit records for sensitive administrative actions.
- Use least-privilege permissions for AI and MCP integrations.
- Avoid logging passwords, session secrets, API keys, or sensitive client data.

Better Auth integration with the Express API must be explicitly tested. Do not assume that protecting a Next.js page automatically protects its backend API endpoints.

## 11. Testing and Quality Assurance

Add tests alongside features rather than waiting until the entire application is complete.

Recommended coverage:

- Unit tests for business logic and utility functions.
- API tests for validation, authentication, authorization, and error responses.
- Integration tests for database-backed workflows.
- Frontend tests for important forms and user interactions.
- End-to-end tests for critical user journeys.
- Responsive and accessibility checks.
- Security checks for unauthorized access and cross-client data exposure.

Before considering a feature complete, verify its happy path, validation errors, failure handling, permissions, and mobile layout.

## 12. Deployment Strategy

### Frontend

Deploy the Next.js application to Vercel or another compatible hosting platform after verifying framework and runtime requirements.

### Backend

Deploy Express to a Node.js-compatible environment that supports the application's runtime and operational needs. Do not assume that a conventional persistent Express server can be deployed unchanged to every serverless platform.

### Database

Use MongoDB Atlas with production-appropriate network access, database permissions, backups, and secret management.

### Production checklist

- Configure production environment variables.
- Configure allowed origins and authentication callbacks.
- Enable HTTPS.
- Verify session and cookie behavior across deployed domains.
- Test database connectivity and authorization.
- Configure email delivery and payment webhooks as applicable.
- Check logs, error monitoring, backups, and recovery procedures.
- Test the deployed application before announcing it publicly.

## 13. Development Workflow

Use a small, verifiable implementation cycle:

1. Read the relevant product and technical documents.
2. Inspect the existing repository and identify dependencies.
3. Select one clearly scoped feature.
4. Write or update its implementation plan.
5. Implement the smallest useful increment.
6. Run relevant tests and inspect the results.
7. Fix regressions before continuing.
8. Update documentation when behavior or architecture changes.
9. Commit the verified changes using a clear Git message.

OpenCode should explain important architectural choices, avoid unnecessary rewrites, and identify assumptions before making risky changes.

## 14. Roadmap

Implementation order should follow the approved product plan. A suggested high-level sequence is:

- [ ] Repository setup and foundational configuration.
- [ ] Design system and responsive public website.
- [ ] Backend foundation and database connectivity.
- [ ] Service and portfolio APIs.
- [ ] Inquiry submission and lead management.
- [ ] Authentication and role-based authorization.
- [ ] Admin dashboard.
- [ ] Client portal and project tracking.
- [ ] Invoice management and verified payment integration.
- [ ] Email notifications and automation.
- [ ] AI integration foundation and approved MCP use cases.
- [ ] Testing, security review, and production deployment.

A roadmap item is complete only when its implementation and required verification are complete.

## 15. Contribution Guidelines

Before submitting changes:

- Follow the project's established naming and formatting conventions.
- Keep frontend, API, database, and business logic responsibilities separate.
- Avoid adding unnecessary dependencies.
- Never commit credentials or sensitive data.
- Add appropriate tests and documentation.
- Confirm that existing functionality remains intact.
- Describe changes, verification performed, and known limitations in the pull request.

## 16. License

The project's license has not yet been specified. Add a `LICENSE` file and update this section only after the owner chooses the appropriate license.

---

**Growers Journy — Build Smarter. Grow Faster.**

Creating useful digital products through web engineering, automation, and AI integration.
