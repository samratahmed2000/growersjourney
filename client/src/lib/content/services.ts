import type { Service } from "@/types/type";

/**
 * The three services offered on the public website.
 *
 * Each `slug` is the anchor id used on /services and the link target from the
 * cards on the homepage, so the two pages can never drift apart.
 *
 * Copy rules: describe what the service covers and how it is delivered. No
 * prices, timelines, client counts, or outcome percentages — none of those
 * have been verified.
 */
export const services: Service[] = [
  {
    slug: "web-application-development",
    title: "Web Application Development",
    summary:
      "Custom web applications — dashboards, client portals, and internal tools — built on a typed, modern stack.",
    icon: "code",
    audience:
      "Teams that have outgrown spreadsheets, shared inboxes, or an off-the-shelf tool that no longer matches how they actually work.",
    problems: [
      "Work is spread across spreadsheets and chat threads, so there is no single source of truth.",
      "An existing tool covers most of the workflow but forces awkward manual steps around the edges.",
      "A prototype works, but it was never built to be maintained, secured, or extended.",
    ],
    deliverables: [
      "A written scope and data model agreed before development starts.",
      "A responsive, keyboard-accessible interface.",
      "A validated API and a database layer that does not trust client input.",
      "Setup notes and a handover walkthrough.",
    ],
    capabilities: [
      "Dashboards and admin tools",
      "Client portals and authenticated areas",
      "Role-based access when the project requires it",
      "API design and third-party integration",
    ],
    technologies: [
      "Next.js",
      "React",
      "TypeScript",
      "Node.js",
      "Express",
      "MongoDB",
    ],
  },
  {
    slug: "business-automation",
    title: "Business Automation",
    summary:
      "Replace repetitive manual steps with reliable, observable workflows that fail loudly instead of silently.",
    icon: "workflow",
    audience:
      "Teams losing hours to copying data between tools, chasing approvals, or re-entering the same information in several places.",
    problems: [
      "The same data is typed into two or three systems, and they disagree.",
      "Follow-ups depend on someone remembering to send them.",
      "A background job fails and nobody notices until a customer complains.",
    ],
    deliverables: [
      "A map of the current workflow, including the exception cases.",
      "Automated steps for the parts that are genuinely repetitive.",
      "Failure handling with retries and a clear place to inspect errors.",
      "Documentation of what runs, when, and what to do when it does not.",
    ],
    capabilities: [
      "Workflow mapping and simplification",
      "Scheduled and event-driven jobs",
      "Data synchronisation between tools",
      "Webhook handling with retries",
    ],
    technologies: ["Node.js", "Express", "MongoDB", "Webhooks"],
  },
  {
    slug: "ai-integration",
    title: "AI Integration",
    summary:
      "AI features that solve a defined task, with a clear failure path and a human in control of the output.",
    icon: "sparkles",
    audience:
      "Teams with repetitive reading, sorting, or drafting work that could be assisted — not replaced blindly.",
    problems: [
      "Incoming messages and documents are read and sorted by hand.",
      "Information is trapped in long documents that nobody has time to search.",
      "A first draft takes longer than the review that follows it.",
    ],
    deliverables: [
      "A narrow, testable use case rather than an open-ended chatbot.",
      "Server-side provider integration, so keys never reach the browser.",
      "A defined fallback behaviour when the model is slow or wrong.",
      "A human review step wherever the output has real consequences.",
    ],
    capabilities: [
      "Document and message triage",
      "Search over your own content",
      "Drafting with human review",
      "Usage logging that contains no unnecessary personal data",
    ],
    technologies: ["Node.js", "TypeScript", "LLM APIs", "Vector search"],
  },
];

/** Lookup used by the contact form's service selector. */
export function getService(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}
