# PRD.md

# Growers Journy — Product Requirements Document

**Project:** Growers Journy Agency Website & Management Platform  
**Version:** 1.0.0  
**Status:** Initial Specification  
**Founder:** Samrat Ahmed  
**Tagline:** Build Smarter. Grow Faster.  
**Product Type:** Agency Website + Business Management Platform

---

## 1. Product Overview

Growers Journy is a technology agency specializing in Web Application Development, Business Automation, and AI Integration.

The product will combine a professional public-facing agency website with an internal management platform that supports client acquisition, project management, service management, portfolio publishing, and business operations.

The platform will initially be operated by the founder and may expand to support additional team members and clients.

The product must prioritize usability, maintainability, security, accessibility, responsive design, and practical business value.

### Product Vision

Help businesses grow through modern web applications, efficient workflows, and practical AI-powered solutions while providing a professional digital platform for discovering, purchasing, and managing Growers Journy services.

### Brand Identity

- **Brand Name:** Growers Journy
- **Tagline:** Build Smarter. Grow Faster.
- **Founder:** Samrat Ahmed
- **Professional Title:** AI-Driven Web Application Engineer (MERN)
- **Primary Brand Color:** `#123C2D`
- **Accent Color:** `#16A36A`
- **Design Direction:** Premium, minimal, modern, professional
- **Theme:** Hybrid light and dark-green visual design

---

## 2. Product Goals

### Primary Goals

1. Establish a credible online presence for Growers Journy.
2. Present agency services clearly and professionally.
3. Showcase projects through a structured portfolio and detailed case studies.
4. Generate qualified client inquiries.
5. Support client registration and secure account management.
6. Allow clients to monitor their projects and communicate project-related information.
7. Enable administrators to manage clients, projects, services, inquiries, and portfolio content.
8. Establish a foundation for invoices, payment records, and business operations.
9. Support appropriate AI integrations and automation workflows.
10. Maintain an architecture that can evolve as the agency grows.

### Secondary Goals

- Improve organic search visibility.
- Simplify repetitive administrative tasks.
- Provide a consistent client experience.
- Support future team expansion.
- Encourage reusable development practices.
- Make content and project updates manageable without repeatedly modifying frontend code.

---

## 3. Target Users

### 3.1 Public Visitors

Individuals visiting the agency website to understand services, review projects, or contact the agency.

**Needs:**

- Clear service information.
- Relevant portfolio examples.
- Professional presentation.
- Transparent project inquiry process.
- Accessible contact information.

### 3.2 Prospective Clients

Businesses, startups, entrepreneurs, and digital agencies seeking technical services.

**Needs:**

- Information about available services.
- A way to describe project requirements.
- Clear communication about scope and expectations.
- A convenient inquiry process.
- Confidence in the agency's development process.

### 3.3 Registered Clients

Clients with active or completed projects.

**Needs:**

- Secure account access.
- Project status and milestone visibility.
- Access to authorized project information.
- Project-related updates.
- Access to applicable invoices and payment records.
- A clear communication process.

### 3.4 Administrator

Initially, the founder will act as the primary administrator.

**Needs:**

- Secure administrative access.
- Client and inquiry management.
- Project creation and updates.
- Portfolio and service management.
- Invoice and payment-record management.
- Operational visibility.
- Control over user permissions and sensitive actions.

### 3.5 Team Members

Future authorized employees or contractors.

**Needs:**

- Access only to assigned projects and permitted features.
- Clear task and milestone information.
- Secure access to relevant client information.
- Appropriate role-based permissions.

Team functionality must remain optional until the agency requires it.

---

## 4. Product Scope

The product consists of two major areas.

### A. Public Agency Website

The public website introduces Growers Journy, explains its services, presents its work, and generates business inquiries.

### B. Agency Management Platform

The private application supports authentication, administration, client access, project tracking, and business operations.

Public and private functionality must be separated through appropriate routing, authentication, authorization, and data-access controls.

---

## 5. Public Website Requirements

### 5.1 Homepage

**Route:** `/`

The homepage must include:

1. Responsive navigation.
2. Hero section.
3. Agency introduction.
4. Services overview.
5. Featured projects.
6. Reasons to choose Growers Journy.
7. Development process.
8. Technology stack.
9. Founder introduction.
10. Testimonials, when genuine testimonials are available.
11. Frequently asked questions.
12. Final call to action.
13. Footer.

The homepage must communicate the agency's value proposition without overwhelming visitors with unnecessary information.

### 5.2 Services

**Route:** `/services`

The services page must present:

- Web Application Development.
- Business Automation.
- AI Integration.

Each service must support a title, description, intended audience, problems addressed, deliverables, relevant technologies, related projects, and inquiry call to action.

Service details should be managed through the application rather than duplicated across multiple components.

### 5.3 Portfolio

**Route:** `/work`

The portfolio must support:

- Project listings.
- Featured projects.
- Category filtering.
- Project summaries.
- Technology tags.
- Project status.
- Live demonstration links, when available.
- Source code links, when appropriate.
- Links to detailed case studies.

Portfolio content must support future additions without requiring structural frontend changes.

### 5.4 Project Case Studies

**Route:** `/work/[slug]`

Each case study should support:

- Project overview.
- Problem statement.
- Objectives.
- Proposed solution.
- Features.
- Technology stack.
- Screenshots.
- Development challenges.
- Implementation details.
- Security and performance considerations.
- Outcomes, when verified.
- Live demo and source code links, when available.

Projects must be labeled accurately as concept, in-progress, or completed.

### 5.5 About

**Route:** `/about`

The page must communicate:

- Agency introduction.
- Mission and vision.
- Founder profile.
- Development philosophy.
- Technology approach.
- Commitment to useful, maintainable solutions.

The website must not imply that the agency has employees, clients, certifications, or achievements that it does not actually have.

### 5.6 Development Process

**Route:** `/process`

The page must explain the standard workflow:

1. Discovery.
2. Planning.
3. UI/UX Design.
4. Development.
5. Testing and Quality Assurance.
6. Deployment and Handover.

Actual processes may vary according to project requirements.

### 5.7 Contact

**Route:** `/contact`

The contact page must provide a functional project inquiry form.

Required fields:

- Full name.
- Business email.
- Requested service.
- Project description.

Optional fields:

- Company name.
- Budget range.
- Expected timeline.
- Reference website.

Requirements:

- Client-side validation.
- Server-side validation.
- Spam prevention.
- Rate limiting.
- Safe data processing.
- Appropriate notification handling.
- Success and error feedback.
- Privacy notice.
- Optional database persistence.

Submitting an inquiry must not require creating an account.

### 5.8 Legal Pages

Required routes:

- `/privacy-policy`
- `/terms`

The content must accurately reflect actual data collection, external integrations, payment processes, and applicable business practices.

Legal content must be reviewed before production use.

---

## 6. Authentication and User Management

Authentication is required for the private management platform.

The preferred authentication solution is Better Auth, subject to compatibility verification with the selected Next.js, database, and ORM versions.

Authentication must support the following capabilities where applicable:

- User registration.
- User login.
- Session management.
- Logout.
- Email verification.
- Password reset.
- Protected routes.
- Administrative access.
- Client account access.
- Role-based authorization.
- Account status management.

Social login is optional and must not block the initial release.

### Authorization Roles

The initial role model should support:

**ADMIN**

- Manage users and access permissions.
- Manage services and portfolio content.
- Manage inquiries and clients.
- Create and update projects.
- Manage project milestones and tasks.
- Manage invoices and payment records.
- Access authorized administrative reports.

**TEAM_MEMBER**

- Access assigned projects.
- View permitted tasks and milestones.
- Update authorized task information.
- Access only the client and project data required for assigned work.

**CLIENT**

- Access their own profile.
- View their own projects.
- View authorized milestones and updates.
- Access their own invoices and payment records.
- Access authorized project documents and communication.

Authorization must be enforced on the server for every sensitive operation.

A hidden navigation link is not a security boundary.

New user registrations must never receive administrative privileges by default.

The initial administrator must be provisioned through a secure, documented setup process.

---

## 7. Admin Dashboard Requirements

**Route Prefix:** `/admin`

The dashboard must be accessible only to authorized administrators.

### 7.1 Dashboard Overview

Display useful operational summaries, such as:

- New inquiries.
- Active projects.
- Projects awaiting action.
- Registered clients.
- Outstanding invoice balances.
- Recent project activity.

Only display metrics supported by actual data.

### 7.2 Inquiry Management

Administrators must be able to:

- View inquiries.
- Search and filter inquiries.
- Review inquiry details.
- Change inquiry status.
- Convert a qualified inquiry into a client or project through an explicit workflow.
- Record internal notes where appropriate.

Suggested inquiry statuses:

- NEW
- REVIEWING
- QUALIFIED
- CONVERTED
- CLOSED

### 7.3 Client Management

Administrators must be able to:

- View clients.
- Review client details.
- Associate clients with projects.
- View authorized project history.
- Update permitted client information.
- Manage client account status according to defined rules.

### 7.4 Project Management

Administrators must be able to:

- Create projects.
- Update project details.
- Assign clients.
- Assign authorized team members.
- Define milestones.
- Create tasks.
- Update project status.
- Publish client-visible progress updates.
- Record completion information.

Suggested project statuses:

- PLANNING
- IN_PROGRESS
- ON_HOLD
- COMPLETED
- CANCELLED

### 7.5 Service Management

Administrators must be able to manage:

- Service titles.
- Descriptions.
- Features.
- Deliverables.
- Publication status.
- Display order.

### 7.6 Portfolio Management

Administrators must be able to:

- Create projects for the public portfolio.
- Update project descriptions.
- Manage categories and technologies.
- Add screenshots and thumbnails.
- Set featured status.
- Publish or unpublish projects.
- Manage public demonstration links.

### 7.7 Invoice Management

The initial invoice module should support:

- Invoice number.
- Associated client.
- Associated project, where applicable.
- Line items.
- Currency.
- Subtotal.
- Applicable taxes or adjustments.
- Total amount.
- Due date.
- Invoice status.
- Payment records.

Suggested invoice statuses:

- DRAFT
- ISSUED
- PARTIALLY_PAID
- PAID
- OVERDUE
- VOID

Invoice totals must be calculated and validated on the server.

Issued invoices must not be silently modified in ways that invalidate their financial history. Corrections should use an auditable adjustment or replacement process.

### 7.8 Payment Management

The platform must distinguish between a payment record and a verified payment transaction.

Manual payment records must be clearly identified as manually recorded.

Online payments must not be marked successful merely because a client returns to a success URL.

Payment status must be verified through a trusted provider response or webhook, with signature verification and duplicate-event protection.

---

## 8. Client Portal Requirements

**Route Prefix:** `/portal`

The client portal must be available only to authenticated clients.

### 8.1 Client Dashboard

Display:

- Active projects.
- Recent project updates.
- Upcoming milestones.
- Outstanding invoices.
- Recent relevant activity.

All information must be scoped to the authenticated client.

### 8.2 Project Details

Clients must be able to view:

- Project title.
- Project description.
- Current status.
- Approved milestones.
- Progress updates.
- Relevant dates.
- Authorized documents.
- Related invoices.

Clients must not be able to access another client's projects by changing a URL or submitting a modified request.

### 8.3 Milestones and Tasks

Clients may view milestones and selected task information that administrators have marked as client-visible.

Internal notes and confidential task details must remain private.

### 8.4 Invoice Access

Clients must be able to view and download their own authorized invoices.

Access must be checked on the server before any invoice document is delivered.

### 8.5 Project Communication

The initial architecture may support project-related comments or messages.

If implemented, communication must include authorization checks, timestamps, safe content rendering, and appropriate retention rules.

Real-time messaging is not required for the initial release.

---

## 9. Database Requirements

The application will use MongoDB Atlas with Mongoose unless compatibility or implementation findings justify an alternative.

The data model must be designed around clear ownership, explicit relationships, validation, and appropriate indexes.

Expected domain entities include:

- Users.
- Authentication records and sessions, as required by Better Auth.
- Services.
- Portfolio projects.
- Project categories.
- Project technologies.
- Inquiries.
- Clients.
- Agency projects.
- Project memberships.
- Milestones.
- Tasks.
- Project updates.
- Invoices.
- Invoice items.
- Payment records.
- Notifications.
- Audit events.
- AI integration usage records, where required.

These are logical entities, not a requirement to create every collection immediately.

The final database design must account for:

- Better Auth adapter compatibility.
- Mongoose model ownership.
- Referential integrity at the application layer.
- Indexes and unique constraints.
- Data validation.
- Soft deletion, where justified.
- Auditability of sensitive operations.
- Backup and recovery.
- Data retention.
- Protection of sensitive information.

Authentication-related records must follow the storage model required by the selected authentication adapter. Do not assume every Better Auth adapter is compatible with arbitrary Mongoose schemas.

---

## 10. API Requirements

The platform will use server-side application interfaces for sensitive business operations.

The preferred initial approach is Next.js Route Handlers, unless a separate Express.js backend is justified by deployment or architectural requirements.

Potential API domains include:

- Authentication.
- Public services.
- Public portfolio.
- Contact inquiries.
- Administrative inquiries.
- Client management.
- Project management.
- Milestones and tasks.
- Invoices.
- Payment verification.
- Notifications.
- AI integrations.

All endpoints must define:

- HTTP method.
- Route.
- Authentication requirement.
- Authorization requirement.
- Input schema.
- Response format.
- Error format.
- Validation rules.
- Rate limits, where applicable.

Public read endpoints should expose only published and explicitly public information.

Sensitive data must not be returned by default.

---

## 11. AI and MCP Requirements

AI capabilities are part of the agency's business direction.

The product must distinguish between:

1. AI-assisted software development.
2. AI-powered features delivered to clients.
3. MCP-based tools used by developers or authorized internal workflows.

### 11.1 AI-Assisted Development

OpenCode may assist with:

- Code exploration.
- Implementation planning.
- Component development.
- Testing.
- Debugging.
- Documentation.
- Code review.

AI-generated changes must be reviewed and tested.

### 11.2 Website AI Integration

Potential future features include:

- AI-powered inquiry assistance.
- Business workflow automation.
- Document processing.
- Intelligent search.
- AI-assisted project summaries.

These features must not be implemented merely because they are technically possible. Each requires a defined use case, expected value, cost assessment, and security review.

### 11.3 MCP Integration

MCP tools may be used for authorized development or internal workflows.

Requirements:

- Use trusted MCP servers.
- Apply least-privilege permissions.
- Keep credentials out of source control.
- Review filesystem, network, and account access.
- Request confirmation for consequential external actions.
- Do not expose internal MCP credentials or tools to public visitors.
- Document setup and troubleshooting procedures.

An MCP server is not required for the public website unless a concrete product requirement justifies one.

---

## 12. Technology Requirements

Preferred stack:

### Frontend

- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS.
- shadcn/ui or another selected component library.
- Lucide icons.

### Backend

- Next.js Route Handlers for the initial application API.
- Node.js runtime where required.
- Mongoose for MongoDB access.
- Server-side validation using Zod or an equivalent schema validator.

### Authentication

- Better Auth, after compatibility verification.

### Infrastructure

- MongoDB Atlas.
- Vercel.
- Git.
- GitHub.
- Environment-based configuration.

### Integrations

- Transactional email provider.
- Payment provider, when selected.
- Analytics, where justified.
- AI provider, when required.
- Optional storage service for project documents and images.

Technology versions must be selected and recorded during setup. Avoid mixing incompatible package versions.

---

## 13. Non-Functional Requirements

### 13.1 Performance

- Minimize unnecessary client-side JavaScript.
- Optimize images and fonts.
- Use server rendering or static rendering where appropriate.
- Avoid unnecessary database queries.
- Paginate large administrative lists.
- Monitor production performance.

### 13.2 Accessibility

- Semantic HTML.
- Keyboard navigation.
- Visible focus indicators.
- Accessible form labels.
- Appropriate color contrast.
- Screen-reader-friendly status messages.
- Reduced-motion support.

### 13.3 Responsive Design

The public website and private platform must support:

- Mobile devices.
- Tablets.
- Desktop screens.

Administrative interfaces must remain usable on smaller screens, although complex tables may use responsive alternatives.

### 13.4 Reliability

- Consistent error handling.
- Safe database operations.
- Clear loading and empty states.
- Controlled external-service failures.
- Appropriate logging.
- Backup and recovery procedures.

### 13.5 Maintainability

- Strict TypeScript where practical.
- Reusable components.
- Clearly defined modules.
- Centralized validation schemas where appropriate.
- Documented environment variables.
- Automated testing.
- Clear development instructions.

---

## 14. Security Requirements

The application must implement security appropriate to its public and authenticated functions.

Minimum requirements:

- Server-side authentication and authorization.
- Secure session handling.
- Secure cookie configuration.
- Password security delegated to the selected authentication library.
- Input validation.
- Output encoding and safe rendering.
- Rate limiting.
- CSRF protection where applicable.
- Secure secret management.
- Restricted file uploads.
- Payment webhook verification.
- Protection against unauthorized object access.
- Safe error responses.
- Dependency maintenance.
- Security logging for sensitive operations.
- Audit trails for important administrative actions.

The application must not rely on frontend checks to enforce permissions.

MongoDB credentials, authentication secrets, AI API keys, email credentials, and payment secrets must never be exposed in client-side bundles.

---

## 15. Privacy Requirements

The platform may process personal and business information.

Requirements:

- Collect only necessary information.
- Explain how inquiry and account data is used.
- Restrict access to personal information.
- Avoid logging passwords, session tokens, payment secrets, or unnecessary personal data.
- Establish retention and deletion policies.
- Protect private project documents.
- Document third-party service involvement.
- Provide appropriate privacy disclosures.

Privacy and legal requirements must be reviewed against the agency's actual operating locations, customers, and integrations before launch.

---

## 16. Acceptance Criteria

The first production-ready release must satisfy the following criteria.

### Public Website

- All primary public routes load successfully.
- Navigation works on mobile and desktop.
- Services display accurate information.
- Portfolio projects can be added and updated without unnecessary frontend rewrites.
- Project detail pages render the correct project.
- Unpublished projects remain private.
- Contact inquiries are validated and processed correctly.
- Visitors receive appropriate submission feedback.
- Legal pages are available.
- SEO metadata is present.
- Accessibility and performance checks are completed.

### Authentication

- Users can complete supported authentication flows.
- Protected routes reject unauthenticated access.
- Role permissions are enforced on the server.
- New users cannot assign themselves administrative roles.
- Sessions are invalidated appropriately on logout.
- Sensitive authentication errors do not disclose secrets.

### Admin Dashboard

- Only authorized administrators can access administrative functions.
- Administrators can manage inquiries.
- Administrators can create and update projects.
- Administrators can manage public services and portfolio content.
- Administrative actions are validated and appropriately logged.

### Client Portal

- Clients can access only their own authorized records.
- Clients can view permitted project information.
- Clients can access their own invoices.
- Unauthorized object access is rejected.

### Financial Operations

- Invoice totals are calculated server-side.
- Payment records are distinguishable from verified payment transactions.
- Payment webhook signatures are validated.
- Duplicate payment events do not create duplicate financial records.
- Financial changes follow defined audit rules.

### AI and MCP

- AI integrations use server-side credentials.
- MCP credentials are not exposed publicly.
- External tool permissions are documented.
- AI-related functionality has defined error handling and cost controls.

### Production Readiness

- Production environment variables are configured.
- Database access is restricted.
- Critical workflows have automated or documented tests.
- Error logging is available without exposing secrets.
- Deployment and recovery procedures are documented.

---

## 17. Out of Scope for the Initial Release

Unless explicitly approved during implementation planning, the following are excluded from the initial release:

- Native mobile applications.
- Multi-tenant SaaS functionality for unrelated agencies.
- Complex payroll.
- Full accounting software.
- Cryptocurrency payments.
- Unrestricted AI agent execution.
- Public access to internal MCP tools.
- Unmoderated user-generated public content.
- Real-time collaboration infrastructure.
- Advanced enterprise analytics.

These features may be reconsidered when justified by actual business requirements.

---

## 18. Development Principles

All implementation work must follow these principles:

1. Understand requirements before coding.
2. Inspect the existing codebase before modifying it.
3. Read the relevant project documentation.
4. Implement features incrementally.
5. Prefer simple solutions over unnecessary abstractions.
6. Validate all untrusted input.
7. Enforce authorization on the server.
8. Never fabricate project data, testimonials, or business metrics.
9. Test important workflows after implementation.
10. Document architectural decisions.
11. Keep secrets out of source control.
12. Verify package and integration compatibility.
13. Obtain approval before destructive or externally consequential actions.
14. Update documentation when requirements or architecture change.

---

## 19. Success Metrics

The following metrics may be introduced after the website launches:

- Qualified inquiries received.
- Inquiry-to-client conversion rate.
- Project proposal acceptance rate.
- Average inquiry response time.
- Number of completed projects.
- Client satisfaction.
- Project delivery reliability.
- Website performance.
- Relevant organic search traffic.

Metrics must be based on actual measurements. The platform must not display invented statistics to imply business success.

---

## 20. Document Governance

This PRD is the source of truth for product goals and functional scope.

Related documents:

- `DESIGN.md` — Design system and user experience.
- `ARCHITECTURE.md` — Application architecture.
- `DATABASE.md` — Data models and persistence.
- `API.md` — Application interfaces.
- `AGENTS.md` — AI development rules.
- `README.md` — Project overview and usage.
- `Project Implementation.md` — Delivery plan.
- `Setup.md` — Development environment.
- `Feature Development.md` — Feature workflow.
- `Authentication & Security.md` — Security requirements.
- `MCP connection.md` — MCP configuration.
- `Integration.md` — External integrations.
- `Testing & QA.md` — Verification strategy.
- `Debugging.md` — Troubleshooting procedures.

If implementation findings reveal conflicts or missing requirements, document the issue and update the relevant specification before making significant architectural changes.
