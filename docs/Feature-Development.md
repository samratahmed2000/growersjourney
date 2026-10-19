# Feature Development Guide — Growers Journy

## 1. Purpose

This document defines the standard workflow for developing new features, improving existing functionality, and fixing feature-level defects in the Growers Journy platform.

Every feature must align with the product requirements, architecture, design system, API conventions, database rules, and security requirements.

**Project:** Growers Journy  
**Tagline:** Build Smarter. Grow Faster.  
**Developer:** Samrat Ahmed  
**Technology:** Next.js, TypeScript, Express.js, MongoDB Atlas, Mongoose, Better Auth, and AI integrations where appropriate.

## 2. Read Before Development

Before implementing a feature, OpenCode must inspect the relevant project documentation:

- `AGENTS.md` — coding and agent instructions.
- `PRD.md` — product requirements and scope.
- `DESIGN.md` — design system and user experience.
- `ARCHITECTURE.md` — module boundaries and application structure.
- `DATABASE.md` — data models and relationships.
- `API.md` — endpoints and authorization requirements.
- `Project Implementation.md` — implementation phases.
- `Setup.md` — environment and runtime configuration.

Inspect the actual repository before relying on these documents. Existing implementation and verified configuration must also be considered.

## 3. Feature Development Principles

Every feature should be:

- **User-focused:** Solve a clearly identified problem.
- **Understandable:** Use simple, readable code and explain important decisions.
- **Modular:** Keep UI, API, business logic, and persistence responsibilities separated.
- **Secure:** Validate data and enforce authorization on the server.
- **Consistent:** Reuse established design patterns and API conventions.
- **Responsive:** Support mobile, tablet, and desktop layouts where applicable.
- **Testable:** Include appropriate verification for expected behavior and failure cases.
- **Maintainable:** Avoid unnecessary dependencies, abstractions, and duplicated logic.

Do not build speculative functionality without a clear requirement or approved use case.

## 4. Standard Feature Workflow

Follow this workflow for each feature.

### Step 1 — Define the Feature

Write a short feature brief containing:

- Feature name.
- User problem.
- Intended users and roles.
- Expected behavior.
- Required frontend and backend changes.
- Data and integration requirements.
- Security considerations.
- Acceptance criteria.
- Out-of-scope behavior.

Ask for clarification if a missing requirement affects data integrity, access permissions, payments, authentication, or external integrations.

### Step 2 — Inspect the Existing Implementation

Before editing:

- Find related components, routes, models, services, and utilities.
- Identify reusable code.
- Check existing naming conventions and dependencies.
- Review the relevant Git changes.
- Determine whether the feature already exists partially.

Never create a duplicate component, endpoint, or database model without checking for an existing implementation.

### Step 3 — Plan the Changes

Prepare a concise implementation plan.

Identify:

1. Files to create or modify.
2. Required API endpoints.
3. Data models and validation rules.
4. Authentication and authorization rules.
5. UI states and user interactions.
6. Tests and verification commands.
7. Dependencies or unresolved decisions.

For small changes, keep the plan short. For cross-cutting or security-sensitive features, document the design before implementation.

### Step 4 — Implement Incrementally

Implement the smallest useful portion first.

A typical feature may follow this sequence:

1. Define requirements and acceptance criteria.
2. Define data contracts and validation.
3. Implement backend business logic.
4. Add the API endpoint and authorization.
5. Verify the API behavior.
6. Implement the frontend interface.
7. Connect the UI to the API.
8. Add loading, empty, success, and error states.
9. Add tests and documentation.
10. Review the final changes.

The sequence may differ for UI-only features or other specialized tasks.

### Step 5 — Verify the Feature

Run relevant existing checks, such as:

- TypeScript type checking.
- Linting.
- Unit tests.
- API and integration tests.
- Production build.
- Manual browser verification.
- Responsive layout checks.

Inspect the project's actual scripts before running commands. Never claim a test passed if it was not executed successfully.

### Step 6 — Review and Report

Before considering the feature complete:

- Review the final diff.
- Check for accidental changes.
- Verify authorization and validation.
- Confirm expected and failure behavior.
- Update documentation where necessary.
- Explain what changed and what remains incomplete.

If verification is blocked by missing credentials or services, report the limitation clearly.

## 5. Feature Specification Template

Use this template for substantial features.

### Feature name

`[Name]`

### Problem

What user problem does this feature solve?

### Users and permissions

Who can use it, and what actions are permitted?

### Expected behavior

Describe the normal user journey.

### Data requirements

List fields, relationships, validation rules, and persistence requirements.

### API requirements

List required endpoints, access rules, request validation, and response behavior.

### UI requirements

Describe the pages, components, interactions, and responsive behavior.

### Error handling

Define behavior for invalid input, missing records, network failures, and unauthorized requests.

### Acceptance criteria

List observable outcomes that must be verified.

### Testing plan

Identify unit, API, integration, and UI tests as appropriate.

### Out of scope

Explicitly identify what this feature will not implement.

## 6. Frontend Development Standards

Use Next.js App Router, React, TypeScript, Tailwind CSS, and the existing shadcn/ui component system where appropriate.

### Component design

- Build reusable components when reuse is justified.
- Keep components focused on a clear responsibility.
- Use descriptive names and typed props.
- Prefer existing UI primitives over duplicated implementations.
- Avoid oversized page components.
- Keep API access and business rules out of purely presentational components when practical.

### Server and client components

- Prefer Server Components when client-side interactivity is unnecessary.
- Use Client Components when browser interaction, local state, or client-side hooks require them.
- Keep secrets and privileged operations on the server.
- Do not assume hiding a button provides authorization.

### Data fetching

- Use a consistent API helper or service layer.
- Handle non-success HTTP responses explicitly.
- Avoid duplicating endpoint URLs and request logic throughout the application.
- Use appropriate loading, error, and empty states.
- Avoid exposing sensitive responses in browser logs.
- Keep caching and revalidation behavior consistent with data privacy requirements.

### Forms

- Use clear labels and field-level validation messages.
- Validate on the client for usability and again on the server for security.
- Prevent duplicate submissions where appropriate.
- Display meaningful success and failure feedback.
- Preserve safe user input when validation fails.
- Never trust client-provided role, ownership, price, invoice total, or payment status.

### UI states

Every data-driven interface should handle the states relevant to its behavior:

- Loading.
- Empty results.
- Successful operation.
- Validation errors.
- Network or server errors.
- Unauthorized access.
- Not-found resources.

## 7. Backend Development Standards

Use Node.js, Express.js, TypeScript, Mongoose, and the existing backend architecture.

Keep responsibilities separate:

- **Routes:** Define endpoint paths and middleware.
- **Controllers:** Translate HTTP requests into application operations and responses.
- **Services:** Implement business rules.
- **Models:** Define database structures and persistence behavior.
- **Validation:** Validate request parameters and payloads.
- **Middleware:** Handle authentication, authorization, rate limits, and shared request concerns.

Avoid unnecessary layers for trivial operations, but do not put all business logic in route handlers.

### API behavior

- Follow the conventions in `API.md`.
- Validate path parameters, query parameters, and request bodies.
- Use consistent response and error formats.
- Return appropriate HTTP status codes.
- Avoid exposing stack traces or internal implementation details.
- Handle missing records and invalid state transitions.
- Apply pagination to potentially large lists.
- Enforce access permissions before returning or modifying private data.

### Database behavior

- Use Mongoose schemas and appropriate validation.
- Create indexes for demonstrated query patterns.
- Handle duplicate-key and database errors deliberately.
- Avoid unrestricted mass updates from user-supplied objects.
- Use transactions or another safe consistency strategy when a workflow requires multiple related writes.
- Do not store credentials or unnecessary sensitive data in ordinary business documents.

## 8. Authentication and Authorization

Authentication verifies who the user is. Authorization determines what that user can do.

Use the roles defined by the project:

- `ADMIN`
- `TEAM_MEMBER`
- `CLIENT`

Enforce permissions on every protected backend operation.

Examples:

- An administrator may manage authorized agency resources.
- A team member may access only the administrative operations permitted by their assigned permissions.
- A client may access only their own authorized projects, milestones, updates, documents, and invoices.

Do not assume role-based restrictions are sufficient for every record. Verify object ownership and project membership as appropriate.

Never permit a user to change their own role or access another client's resources by altering an ID in a URL.

## 9. Data and State Management

Before creating or changing a model:

- Check `DATABASE.md`.
- Identify required and optional fields.
- Define allowed statuses and state transitions.
- Identify ownership and relationship rules.
- Determine whether existing records require a migration or compatibility strategy.
- Define relevant indexes and validation.
- Consider concurrent updates and duplicate requests.

Avoid storing the same authoritative data in multiple places without a defined synchronization strategy.

The database and trusted backend logic should remain authoritative for important business state.

## 10. Contact and Lead Features

For inquiry-related features:

- Validate required fields and email format.
- Enforce length limits and allowed values.
- Apply spam protection and rate limits.
- Persist valid inquiries before attempting nonessential notifications.
- Handle email failures without silently losing the inquiry.
- Restrict inquiry records and follow-up notes to authorized staff.
- Record status changes and relevant follow-up actions when required.

Use only the inquiry statuses defined in the project documentation unless an approved change is made.

## 11. Invoice and Payment Features

Financial features require additional review.

- Calculate totals on the server.
- Validate currency, amounts, and invoice state transitions.
- Keep payment records distinct from invoice records.
- Verify provider webhooks before processing them.
- Make webhook processing idempotent.
- Do not trust payment success claims from the browser.
- Prevent unauthorized changes to issued or paid invoices.
- Keep an audit trail for consequential financial changes.

Do not implement a real payment flow using fake success responses and present it as production-ready.

## 12. AI and MCP Features

Before implementing AI functionality, define the use case, expected input, expected output, permissions, cost constraints, and failure behavior.

Requirements:

- Keep AI provider credentials server-side.
- Validate input and model output.
- Treat model output and external content as untrusted.
- Apply access controls and usage limits.
- Avoid sending unnecessary client or financial data to external providers.
- Log usage without recording secrets.
- Restrict MCP tools to the minimum permissions required.
- Require explicit approval for consequential external actions.

Do not grant AI unrestricted access to the database, payment operations, administrative accounts, or client information.

## 13. Testing Strategy

Choose tests based on feature risk and complexity.

### Unit tests

Test isolated business rules, calculations, validation helpers, and utilities.

### API tests

Test request validation, response status codes, authentication, authorization, and error handling.

### Integration tests

Test database-backed workflows, inquiry persistence, state transitions, and provider event processing where relevant.

### Frontend tests

Test form behavior, validation feedback, loading states, and important user interactions.

### End-to-end tests

Test critical user journeys, such as:

- Submitting a public inquiry.
- An administrator reviewing and updating a lead.
- A client viewing an authorized project.
- A client being denied access to another client's project.
- An invoice reflecting a verified payment event.

Never use production customer data as ordinary test fixtures.

## 14. Accessibility and Responsive Design

- Use semantic HTML.
- Provide labels for form controls.
- Ensure keyboard-accessible interactions.
- Maintain readable contrast.
- Provide visible focus states.
- Avoid communicating status using color alone.
- Check long content and error messages on small screens.
- Use responsive layouts consistent with `DESIGN.md`.

A feature is not complete merely because it looks correct on one desktop viewport.

## 15. Error Handling and Observability

Design useful error handling for:

- Invalid requests.
- Missing resources.
- Authentication failures.
- Authorization failures.
- Database failures.
- External provider outages.
- Rate-limit responses.
- Unexpected server errors.

Show users clear messages without disclosing internal details. Log enough information for debugging while avoiding passwords, tokens, API keys, and unnecessary personal data.

Use request identifiers or structured logs where appropriate for tracing failures.

## 16. Dependency Management

Before adding a package:

1. Check whether existing dependencies already solve the problem.
2. Confirm compatibility with the current runtime.
3. Review maintenance, security, and licensing considerations.
4. Explain why the dependency is necessary.
5. Install it using the project's package manager.
6. Verify the application after installation.

Do not upgrade unrelated packages or replace established libraries without a justified reason.

## 17. Git Workflow

- Review `git status` before modifying files.
- Keep changes focused on the current feature.
- Review `git diff` before committing.
- Do not discard existing user work.
- Use clear, descriptive commit messages.
- Do not commit secrets or real client data.

Example:

```text
feat: add inquiry management filters
fix: enforce client project ownership
test: cover invoice state transitions
docs: document inquiry API behavior
```

## 18. Definition of Done

A feature is complete when:

- [ ] Requirements and acceptance criteria are met.
- [ ] Implementation follows the project architecture.
- [ ] Frontend and backend validation are appropriate.
- [ ] Authentication and authorization are enforced where required.
- [ ] Relevant UI states are handled.
- [ ] Relevant tests and checks have been executed.
- [ ] No known critical regression remains.
- [ ] Responsive behavior has been verified where applicable.
- [ ] Documentation is updated when necessary.
- [ ] Actual test results and remaining limitations are reported.

## 19. OpenCode Feature Prompt Template

Use this prompt whenever you want OpenCode to implement a new feature.

> Read `AGENTS.md`, `PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, and `Feature Development.md`.
>
> Inspect the current repository and identify the existing implementation relevant to **[FEATURE NAME]**.
>
> First, explain the feature's requirements, affected files, implementation plan, security considerations, and acceptance criteria. Do not modify files until the plan is clear.
>
> After approval, implement the smallest complete increment using the existing architecture and dependencies. Validate data on the server, enforce authorization, handle loading and error states, and add appropriate tests.
>
> Run the relevant available checks, inspect the final diff, and report exactly what changed, which checks passed or failed, and what remains incomplete.
>
> Do not invent credentials, fake successful integrations, overwrite unrelated work, or perform destructive operations without approval.

## 20. Final Principle

**Understand the requirement. Inspect before editing. Implement incrementally. Verify before declaring completion.**

Every feature should make Growers Journy more useful, secure, reliable, and maintainable.
