# DESIGN.md

# Growers Journy — UI/UX Design System

**Project:** Growers Journy Agency Website & Management Platform  
**Version:** 1.0.0  
**Design Direction:** Premium, Minimal, Modern, Professional  
**Theme:** Hybrid Light and Dark Green  
**Primary Brand Color:** `#123C2D`  
**Accent Color:** `#16A36A`  
**Tagline:** Build Smarter. Grow Faster.

---

## 1. Design Vision

Growers Journy must have a premium, trustworthy, modern, and growth-oriented visual identity.

The design should communicate technical competence, business understanding, and practical innovation.

The website must not look like a generic agency template. It should have a distinctive brand identity, consistent visual hierarchy, carefully selected typography, and purposeful interactions.

### Core Design Principles

1. Professional before decorative.
2. Clear communication before visual complexity.
3. Consistency across all pages.
4. Mobile-first responsive design.
5. Accessibility by default.
6. Purposeful animation.
7. Reusable components.
8. Fast loading and efficient rendering.
9. Consistent design across public and authenticated interfaces.
10. No fabricated business claims or misleading interface content.

### Visual Personality

The interface should feel:

- Innovative.
- Reliable.
- Refined.
- Calm.
- Growth-oriented.
- Technology-focused.
- Business-friendly.

Avoid excessive gradients, oversized decorative graphics, unnecessary glassmorphism, distracting animations, and inconsistent component styles.

---

## 2. Brand Identity

### 2.1 Brand Name

**Growers Journy**

### 2.2 Tagline

**Build Smarter. Grow Faster.**

Use the exact approved spelling of the brand name and tagline.

Do not automatically change "Journy" to "Journey".

### 2.3 Logo Direction

The logo should use a distinctive GJ-centered identity.

Requirements:

- Use the approved Growers Journy logo asset when available.
- Preserve the original proportions.
- Do not add an arrow symbol.
- Do not distort the logo.
- Maintain sufficient spacing around the logo.
- Provide an appropriate light-background and dark-background version when available.
- Use a suitable text fallback if the image asset cannot load.
- Never recreate the official logo with arbitrary text when the approved asset is available.

Recommended asset organization:

```text
public/
└── images/
    └── brand/
        ├── logo.svg
        ├── logo-light.svg
        ├── logo-dark.svg
        └── favicon.svg
```

These filenames are conventions, not a requirement to create duplicate assets when one approved logo is sufficient.

### 2.4 Brand Application

The brand should remain recognizable across:

- Public website.
- Admin dashboard.
- Client portal.
- Emails.
- Inquiry notifications.
- Project documents.
- Future integrations.

Internal interfaces may use denser layouts than public pages, but they must preserve the brand's typography, colors, spacing, and interaction patterns.

---

## 3. Color System

Use CSS variables or the selected component library's semantic theme tokens.

Do not scatter unrelated hexadecimal color values throughout components.

### 3.1 Brand Colors

| Token              | Value     | Purpose                                        |
| ------------------ | --------- | ---------------------------------------------- |
| Brand Primary      | `#123C2D` | Primary brand background and major UI elements |
| Brand Accent       | `#16A36A` | Accent elements and selected highlights        |
| Brand Accent Hover | `#128653` | Hover state for accent buttons                 |
| White              | `#FFFFFF` | Cards and light surfaces                       |
| Light Background   | `#F5F8F6` | Main public page background                    |
| Primary Text       | `#14231C` | Main text on light surfaces                    |
| Secondary Text     | `#5B6B62` | Supporting text                                |
| Border             | `#DFE7E1` | Borders and separators                         |

### 3.2 Light Theme

Use the light theme for most public-facing content.

Suggested semantic mapping:

```css
:root {
  --background: #f5f8f6;
  --foreground: #14231c;

  --card: #ffffff;
  --card-foreground: #14231c;

  --primary: #123c2d;
  --primary-foreground: #ffffff;

  --accent: #16a36a;
  --accent-foreground: #ffffff;

  --secondary: #eaf1ec;
  --secondary-foreground: #123c2d;

  --muted: #edf2ee;
  --muted-foreground: #5b6b62;

  --border: #dfe7e1;
  --input: #dfe7e1;

  --ring: #16a36a;
}
```

These variables are a proposed semantic foundation. Adapt the exact variable names to the selected UI framework.

### 3.3 Dark Theme

Use dark green backgrounds selectively for:

- Hero sections.
- Selected feature sections.
- Final calls to action.
- Footer.
- Optional dark dashboard surfaces.

Suggested colors:

| Token                 | Value     |
| --------------------- | --------- |
| Dark Background       | `#0B1711` |
| Dark Surface          | `#10251B` |
| Dark Elevated Surface | `#173126` |
| Dark Primary Text     | `#F5F8F6` |
| Dark Secondary Text   | `#B4C5B9` |
| Dark Border           | `#294538` |
| Dark Accent           | `#36C98A` |

Dark surfaces must provide sufficient contrast for all text and interactive elements.

Do not apply dark backgrounds indiscriminately to every public section.

### 3.4 Semantic Status Colors

Use semantic colors for application status indicators.

| Status Type   | Suggested Treatment |
| ------------- | ------------------- |
| Success       | Green               |
| Warning       | Amber               |
| Error         | Red                 |
| Informational | Blue                |
| Neutral       | Gray                |

Status must never be communicated by color alone. Include text labels or appropriate accessible descriptions.

### 3.5 Contrast Requirements

- Normal text must meet WCAG AA contrast requirements.
- Large text must meet WCAG AA contrast requirements.
- Form controls and meaningful interface boundaries must remain distinguishable.
- Hover, focus, disabled, and error states must be visually clear.

Do not assume every brand color combination is automatically accessible. Verify actual contrast ratios before production.

---

## 4. Typography

Use a modern sans-serif typeface.

Preferred options:

1. Geist.
2. Inter.
3. Manrope.

Choose one primary font family and use it consistently.

### 4.1 Typography Hierarchy

| Element         | Desktop Size | Mobile Size |
| --------------- | -----------: | ----------: |
| Hero Heading    |      52–72px |     36–46px |
| Page Heading    |      40–56px |     32–40px |
| Section Heading |      32–44px |     26–34px |
| Card Heading    |      20–24px |     18–22px |
| Body Large      |      18–20px |     17–18px |
| Body            |      16–18px |        16px |
| Supporting Text |      14–16px |     14–15px |
| Small Metadata  |      12–14px |     12–14px |

These values are starting guidelines, not rigid requirements.

Use responsive typography with `clamp()` where appropriate.

Example:

```css
.hero-title {
  font-size: clamp(2.25rem, 5vw, 4.5rem);
  line-height: 1.08;
  letter-spacing: -0.04em;
}
```

### 4.2 Typography Rules

- Use clear heading hierarchy.
- Avoid excessive uppercase text.
- Limit long line lengths.
- Use readable line height.
- Maintain consistent font weights.
- Avoid unnecessary decorative font combinations.
- Ensure headings wrap properly on mobile devices.

For long-form content, aim for approximately 60–80 characters per line on large screens.

---

## 5. Layout System

Use a consistent layout and spacing system throughout the application.

### 5.1 Container

Recommended maximum content width:

- Standard content: approximately 1200px.
- Wide dashboards and project grids: approximately 1400px.
- Long-form reading content: approximately 760px.

Use responsive horizontal padding.

Example:

```css
.container {
  width: min(100% - 2rem, 1200px);
  margin-inline: auto;
}
```

The implementation may use Tailwind utility classes or reusable layout components instead of this CSS.

### 5.2 Spacing Scale

Use a consistent spacing scale based on multiples of four.

| Token | Value |
| ----- | ----: |
| XS    |   4px |
| SM    |   8px |
| MD    |  12px |
| LG    |  16px |
| XL    |  24px |
| 2XL   |  32px |
| 3XL   |  48px |
| 4XL   |  64px |
| 5XL   |  80px |
| 6XL   |  96px |

Choose spacing according to visual hierarchy rather than applying the same gap everywhere.

### 5.3 Border Radius

Suggested values:

- Small controls: 6px.
- Inputs and standard buttons: 8px.
- Cards: 12px.
- Featured panels: 16px.
- Large promotional surfaces: 20px.

Avoid using excessive pill-shaped containers for every component.

Pill styling may be appropriate for badges, tags, or selected compact controls.

### 5.4 Shadows

Use subtle shadows only where they improve depth or hierarchy.

Avoid heavy shadows around every card.

Borders and surface contrast should provide most of the visual structure.

---

## 6. Design Architecture

Organize the interface into reusable components.

Suggested component groups:

```text
components/
├── ui/
│   ├── button.tsx
│   ├── input.tsx
│   ├── textarea.tsx
│   ├── select.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── skeleton.tsx
│   └── tooltip.tsx
│
├── layout/
│   ├── site-header.tsx
│   ├── site-footer.tsx
│   ├── page-container.tsx
│   └── section-heading.tsx
│
├── marketing/
│   ├── hero-section.tsx
│   ├── services-section.tsx
│   ├── featured-projects.tsx
│   ├── process-section.tsx
│   ├── founder-section.tsx
│   ├── faq-section.tsx
│   └── final-cta.tsx
│
├── admin/
│   ├── admin-sidebar.tsx
│   ├── admin-header.tsx
│   ├── dashboard-stat-card.tsx
│   ├── data-table.tsx
│   └── status-badge.tsx
│
└── portal/
    ├── portal-sidebar.tsx
    ├── portal-header.tsx
    ├── project-summary-card.tsx
    ├── milestone-list.tsx
    └── invoice-summary.tsx
```

This structure is illustrative. Follow `ARCHITECTURE.md` for the final folder structure.

Do not create every component before it is required.

Reusable components must have clear responsibilities and consistent interfaces.

---

## 7. Navigation Design

### 7.1 Public Navigation

Recommended navigation:

- Home
- Services
- Our Work
- About
- Our Process
- Contact

Primary CTA:

**Discuss Your Project**

Requirements:

- Display the approved logo.
- Use a clear active state.
- Support keyboard navigation.
- Provide a mobile menu.
- Prevent horizontal overflow.
- Ensure the menu closes appropriately after navigation.
- Keep the CTA visually prominent without overwhelming other links.

The public navigation must not display administrative links to ordinary visitors.

### 7.2 Admin Navigation

Suggested navigation groups:

**Overview**

- Dashboard

**Business**

- Inquiries
- Clients
- Projects
- Services
- Portfolio

**Finance**

- Invoices
- Payments

**Management**

- Team
- Notifications
- Settings

Only show modules that have actually been implemented and authorized for the current administrator.

### 7.3 Client Navigation

Suggested navigation:

- Dashboard
- My Projects
- Milestones
- Invoices
- Notifications
- Profile
- Account Settings

Clients must never see links that expose administrative functionality.

---

## 8. Homepage Design

The homepage must tell a coherent story and guide visitors toward contacting the agency.

### 8.1 Hero Section

**Headline:**

Build Smarter. Grow Faster.

**Supporting Copy:**

We build modern web applications, automate business workflows, and integrate AI to help businesses solve problems, improve efficiency, and scale with confidence.

**Primary CTA:**

Discuss Your Project

**Secondary CTA:**

Explore Our Work

Design requirements:

- Strong typographic hierarchy.
- Clear text contrast.
- Restrained decorative elements.
- Responsive content layout.
- Appropriate spacing.
- A relevant application visual or approved brand graphic.
- No fabricated metrics or client logos.

A two-column desktop layout may be used, collapsing into a single-column mobile layout.

### 8.2 Trust and Expertise

Display actual capabilities and working principles.

Examples:

- Modern Web Technologies.
- Responsive Application Development.
- AI-Assisted Development.
- Structured Project Delivery.
- Security-Conscious Engineering.

Do not use unsupported claims such as "trusted by 500+ companies."

### 8.3 Services

Display three primary service cards:

1. Web Application Development.
2. Business Automation.
3. AI Integration.

Each card should contain:

- Relevant icon.
- Service title.
- Short description.
- A small set of relevant capabilities.
- A link to service details.

Use consistent card layouts and avoid unnecessary decorative effects.

### 8.4 Featured Projects

Each project card should support:

- Thumbnail.
- Project title.
- Short summary.
- Category.
- Technology tags.
- Project status.
- Case study link.

Only published portfolio projects may appear publicly.

Concept projects must be labeled accurately.

### 8.5 Why Choose Us

Use a structured grid to explain the agency's working principles.

Examples:

- Business-Focused Solutions.
- Modern Technology.
- Clear Communication.
- Responsive Experiences.
- Maintainable Code.
- Practical AI Integration.

### 8.6 Development Process

Display six stages:

1. Discovery.
2. Planning.
3. Design.
4. Development.
5. Testing.
6. Deployment.

Use a horizontal layout on large screens and a vertical or compact layout on smaller screens.

### 8.7 Technology Stack

Present relevant technologies in a clean grid.

Do not treat technology logos as proof of expertise.

Only display technologies that the agency can reasonably support for the advertised service.

### 8.8 Founder Section

Present Samrat Ahmed as the founder and AI-Driven Web Application Engineer (MERN).

Include:

- Professional portrait, when available.
- Short biography.
- Development philosophy.
- Link to the About page.

Do not imply that a larger team exists unless it actually does.

### 8.9 Testimonials

Display genuine testimonials only.

If no verified testimonials are available, hide the section or replace it with a useful explanation of the agency's process.

### 8.10 FAQ

Use accessible disclosure components.

Questions must have clear answers, and interactive elements must work with a keyboard.

### 8.11 Final CTA

**Heading:**

Have a Project in Mind? Let's Build Something Useful.

**CTA:**

Discuss Your Project

Use a strong brand-colored surface and a clear visual hierarchy.

### 8.12 Footer

Include:

- Logo.
- Tagline.
- Agency summary.
- Navigation links.
- Service links.
- Contact information.
- Social links.
- Legal pages.
- Copyright information.

Do not display fabricated contact details or social links.

---

## 9. Services Page Design

The services page must provide a consistent presentation for all three services.

Each service detail page should contain:

1. Service introduction.
2. Problems addressed.
3. Proposed solutions.
4. Deliverables.
5. Relevant capabilities.
6. Technology considerations.
7. Development process.
8. Related portfolio projects.
9. FAQ.
10. Project inquiry CTA.

Use a shared service-detail layout.

The page must clearly distinguish currently available services from future or experimental capabilities.

---

## 10. Portfolio Design

### 10.1 Portfolio Listing

The portfolio page should support:

- Responsive project grid.
- Category filters.
- Optional search when useful.
- Featured project highlighting.
- Empty state.
- Loading state.
- Clear project links.

Filters must remain usable on mobile devices.

### 10.2 Project Detail Page

Each case study should use a consistent layout.

Recommended sequence:

1. Project title and overview.
2. Hero image or application screenshot.
3. Project context.
4. Problem statement.
5. Solution.
6. Features.
7. Technology stack.
8. Implementation details.
9. Challenges and lessons.
10. Verified results, when available.
11. Live demo and source links.
12. Related projects.
13. Contact CTA.

Optimize screenshots and preserve their aspect ratios.

Avoid stretching images or hiding important interface details.

---

## 11. Contact Form Design

The contact form must feel professional and easy to complete.

### Required Fields

- Full name.
- Business email.
- Service selection.
- Project description.

### Optional Fields

- Company name.
- Budget range.
- Expected timeline.
- Reference URL.

### Interaction States

Every form must support:

- Default state.
- Focus state.
- Validation error state.
- Submitting state.
- Success state.
- Server error state.

Requirements:

- Associate every input with an accessible label.
- Explain validation errors clearly.
- Preserve valid user input when appropriate.
- Prevent accidental repeated submissions.
- Show a clear success message after confirmed submission.
- Never display success before the server confirms the operation.

Use appropriate native input types and semantic form controls.

---

## 12. Admin Dashboard Design

The admin dashboard should prioritize operational efficiency.

### 12.1 Layout

Desktop:

- Persistent sidebar.
- Top navigation bar.
- Main content region.
- Contextual page actions.

Mobile:

- Collapsible navigation.
- Compact header.
- Stacked summary cards.
- Responsive data presentation.

### 12.2 Dashboard Cards

Potential summary cards:

- New Inquiries.
- Active Projects.
- Registered Clients.
- Outstanding Invoices.

Use actual backend data.

Do not display fabricated statistics, placeholder financial figures, or misleading business metrics in production.

### 12.3 Tables

Administrative tables must support appropriate combinations of:

- Sorting.
- Search.
- Filtering.
- Pagination.
- Row actions.
- Loading states.
- Empty states.
- Error states.

Use responsive alternatives for narrow screens.

Destructive actions must require suitable confirmation.

### 12.4 Forms

Administrative forms must provide:

- Clear field labels.
- Validation feedback.
- Save and cancel actions.
- Loading states.
- Success notifications.
- Error messages.
- Unsaved-change protection where appropriate.

Avoid unnecessarily complex multi-step forms.

---

## 13. Client Portal Design

The client portal should feel trustworthy and straightforward.

### Dashboard

Display:

- Welcome message.
- Active projects.
- Recent updates.
- Upcoming milestones.
- Outstanding invoices.

### Project Details

Display:

- Project title.
- Current status.
- Progress information.
- Client-visible milestones.
- Important dates.
- Authorized documents.
- Recent updates.

### Invoices

Display:

- Invoice number.
- Issue date.
- Due date.
- Total.
- Amount paid.
- Remaining balance.
- Payment status.

Only display records belonging to the authenticated client.

### Interaction Principles

- Use clear labels.
- Avoid unexplained technical terminology.
- Distinguish internal information from client-visible information.
- Provide helpful empty states.
- Avoid overwhelming clients with administrative details.

---

## 14. Authentication UI

Authentication pages should follow the main design system.

Potential routes:

- Login.
- Registration.
- Email verification.
- Forgot password.
- Reset password.
- Account settings.

Requirements:

- Clear form labels.
- Accessible validation.
- Loading and error states.
- Secure authentication flow.
- Appropriate session handling.
- No disclosure of sensitive account information.

Registration must never allow a visitor to choose an administrative role.

Use the authentication library's supported components or APIs where appropriate, without inventing incompatible authentication flows.

---

## 15. Buttons and Interactive Components

### Primary Button

Use the brand primary color with an accessible foreground.

Examples:

- Discuss Your Project.
- Create Project.
- Save Changes.

### Secondary Button

Use a neutral surface or subtle border.

Examples:

- Explore Our Work.
- Cancel.
- View Details.

### Destructive Button

Use an appropriate error color.

Examples:

- Delete Project.
- Remove Member.

Destructive actions should include confirmation when data loss or business impact is significant.

### Interaction Rules

- Provide visible focus indicators.
- Provide appropriate hover states.
- Avoid excessive animation.
- Maintain consistent button sizes.
- Prevent accidental duplicate submissions.
- Use appropriate disabled states.
- Ensure all interactive elements are keyboard accessible.

---

## 16. Forms and Validation UI

Use a consistent form system.

Every form should support:

- Labels.
- Optional or required indicators.
- Help text when necessary.
- Inline validation messages.
- Submission feedback.
- Error recovery.

Client-side validation improves usability but does not replace server-side validation.

Never rely exclusively on visual states to communicate errors.

---

## 17. Data Visualization

Use charts only when they help administrators understand real data.

Potential examples:

- Inquiry trends.
- Project status distribution.
- Revenue summaries.
- Payment history.

Requirements:

- Display accurate data.
- Provide understandable labels.
- Use accessible colors.
- Include suitable alternative descriptions.
- Avoid misleading chart scales.
- Provide a table or textual alternative when appropriate.

Do not add a chart library unless the application requires charts.

---

## 18. Responsive Design

Follow a mobile-first implementation strategy.

Suggested breakpoints:

| Breakpoint  | Minimum Width | Typical Usage  |
| ----------- | ------------: | -------------- |
| Small       |         640px | Large phones   |
| Medium      |         768px | Tablets        |
| Large       |        1024px | Laptops        |
| Extra Large |        1280px | Desktop        |
| Wide        |        1536px | Large displays |

Use the selected framework's standard breakpoint configuration unless the project has a documented reason to customize it.

### Mobile Requirements

- No unintended horizontal scrolling.
- Readable typography.
- Touch-friendly controls.
- Appropriate spacing.
- Accessible navigation.
- Responsive images.
- Forms that fit narrow screens.
- Tables with usable responsive alternatives.
- Clear focus and error states.

Test representative screen sizes rather than relying solely on CSS assumptions.

---

## 19. Animation and Motion

Use motion only when it improves understanding or feedback.

Permitted examples:

- Subtle hover transitions.
- Small button interactions.
- Short menu transitions.
- Lightweight section reveals.
- Loading indicators.

Avoid:

- Continuous decorative animation.
- Excessive parallax.
- Large animated backgrounds.
- Motion that blocks interaction.
- Heavy animation libraries without a demonstrated need.

Respect `prefers-reduced-motion`.

Core navigation and functionality must work without animation.

---

## 20. Iconography and Imagery

### Icons

Use a consistent icon library, preferably Lucide.

Requirements:

- Consistent visual weight.
- Appropriate sizing.
- Accessible labels for meaningful icon-only controls.
- No unnecessary mixing of unrelated icon styles.

### Imagery

Prefer:

- Real application screenshots.
- Genuine project visuals.
- Approved brand assets.
- Relevant technical illustrations.
- High-quality, properly licensed images.

Avoid:

- Misleading client screenshots.
- Unlicensed assets.
- Fake customer logos.
- Fabricated team photos.
- Irrelevant stock imagery.
- Excessive decorative graphics.

Images must be optimized and include suitable alternative text when informative.

Decorative images should use empty alternative text where appropriate.

---

## 21. Accessibility Requirements

Target WCAG 2.2 Level AA where applicable.

Requirements include:

- Semantic HTML.
- Keyboard navigation.
- Visible focus states.
- Accessible form labels.
- Appropriate color contrast.
- Meaningful link text.
- Accessible dialogs.
- Proper focus management.
- Accessible status messages.
- Reduced-motion support.
- Screen-reader-compatible interactions.

Do not remove native focus outlines without providing an accessible replacement.

Use ARIA only when necessary; prefer correct native HTML semantics.

---

## 22. Loading, Empty, Error, and Success States

Every data-driven page must handle the following states.

### Loading

Use appropriate loading indicators or skeletons.

### Empty

Explain why no records are available and provide a relevant next action when appropriate.

### Error

Display a clear, non-sensitive error message and a recovery option where possible.

### Success

Confirm that the requested operation completed successfully.

### Unauthorized

Explain that authentication or permission is required without exposing private information.

### Not Found

Display a suitable page for missing projects, records, and routes.

Never show a successful operation when the backend operation has failed.

---

## 23. UI Component Standards

Use one primary component library for the design system.

The preferred default is shadcn/ui with Tailwind CSS, unless implementation findings favor daisyUI.

Avoid mixing multiple component libraries without a clear reason.

All reusable components must:

- Have a clear purpose.
- Follow consistent naming conventions.
- Support accessible interaction.
- Use design tokens.
- Avoid unnecessary duplication.
- Expose appropriate typed properties.
- Support loading, disabled, or error states when applicable.

Avoid creating abstractions for components that are unlikely to be reused.

---

## 24. Design Quality Checklist

Before completing a page, verify:

### Visual Consistency

- Brand colors are consistent.
- Typography follows the defined hierarchy.
- Spacing is consistent.
- Cards and buttons use appropriate styles.
- Images preserve their proportions.
- The page matches the brand identity.

### Functionality

- Links navigate correctly.
- Buttons perform their intended actions.
- Forms display appropriate feedback.
- Filters and search work correctly.
- Dialogs and menus behave correctly.

### Responsiveness

- Mobile layout works.
- Navigation is usable.
- Content does not overflow.
- Forms fit the screen.
- Tables remain usable.

### Accessibility

- Keyboard navigation works.
- Focus indicators are visible.
- Forms have labels.
- Contrast is adequate.
- Status messages are understandable.

### Performance

- Images are optimized.
- Client-side JavaScript is justified.
- Animations are lightweight.
- Layout shifts are minimized.

### Security

- Sensitive data is not exposed.
- Private pages enforce authorization.
- Unauthorized actions fail safely.
- Error messages do not reveal secrets.

---

## 25. AI Development Instructions

When implementing this design system, AI coding tools must:

1. Read `PRD.md` and this file before major UI implementation.
2. Inspect existing components before creating new ones.
3. Reuse existing design tokens and components.
4. Follow the established architecture.
5. Avoid unnecessary package installations.
6. Never invent agency achievements or client testimonials.
7. Implement responsive states alongside desktop layouts.
8. Include loading, empty, error, and success states for data-driven interfaces.
9. Verify keyboard accessibility and color contrast.
10. Avoid implementing non-functional buttons or decorative controls that imply unavailable features.
11. Run the relevant checks after changing components.
12. Update documentation when a deliberate design decision changes.

If an instruction conflicts with the product requirements or a security requirement, follow the higher-priority project specification and document the conflict.

---

## 26. Design Governance

This file is the source of truth for the visual design system.

Related specifications:

- `PRD.md` — Product requirements.
- `ARCHITECTURE.md` — Component and application structure.
- `Feature Development.md` — Feature implementation workflow.
- `Testing & QA.md` — Accessibility and interface verification.
- `AGENTS.md` — AI coding rules.

Any intentional design-system change should be documented rather than introduced inconsistently across components.
