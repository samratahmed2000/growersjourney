import type { Project } from "@/types/type";

/**
 * Portfolio content.
 *
 * IMPORTANT — these are *concepts*, not delivered client work. Every entry has
 * `isSample: true`, and the UI renders a visible "Concept" label so a visitor
 * can never mistake them for commercial projects.
 *
 * To replace a concept with real work later:
 *   1. Swap the copy, category, and technologies.
 *   2. Set `isSample: false` only once the work is genuinely completed.
 *   3. Set `status` to "completed" and add `liveUrl` / `sourceUrl` if they exist.
 *   4. Never add a client name, logo, or result metric without written approval
 *      from that client.
 */
export const projects: Project[] = [
  {
    slug: "operations-dashboard-concept",
    title: "Operations Dashboard Concept",
    summary:
      "A concept for a single dashboard that shows project status, deadlines, and billing in one place.",
    category: "Web application",
    technologies: ["Next.js", "TypeScript", "Node.js", "MongoDB"],
    status: "concept",
    isSample: true,
    featured: true,
    context:
      "Small agencies and service teams often run their work across a spreadsheet, a shared inbox, and two or three separate tools. Each tool is reasonable on its own; together they create a picture nobody fully trusts.",
    problem:
      "Status is updated in one place and read in another. Deadlines are tracked in a calendar, while the work itself lives in a task board. Preparing a weekly update becomes a manual reconciliation exercise, and the numbers in it are already stale by the time it is finished.",
    solution:
      "The concept consolidates projects, tasks, and invoices behind one authenticated dashboard. A project has one status, derived from its tasks rather than retyped. Role-based views give an owner the full picture and a team member only their assigned work, and a weekly summary is generated from the same data the dashboard displays.",
    features: [
      "A project list with status derived from task completion, not manual entry",
      "A per-project timeline that highlights upcoming and overdue deadlines",
      "Role-based views for owners, project managers, and contributors",
      "Invoice status shown next to the work it belongs to",
      "A generated weekly summary with no copy-and-paste step",
    ],
    challenges: [
      "Keeping one status field authoritative when several people update the same project — solved by deriving status from tasks instead of storing it separately.",
      "Deciding which data a role may see without making the interface confusing — solved by separating the navigation per role rather than hiding individual widgets.",
    ],
    learnings: [
      "A dashboard is only useful if the data underneath it is trusted; the data model needed more attention than the chart components.",
      "A small number of well-chosen views beats a page full of configurable widgets.",
    ],
  },
  {
    slug: "inquiry-workflow-concept",
    title: "Inquiry Workflow Concept",
    summary:
      "A concept for turning inbound inquiries into a tracked pipeline with automated reminders and clean handoffs.",
    category: "Automation",
    technologies: ["Node.js", "Express", "MongoDB", "Webhooks"],
    status: "concept",
    isSample: true,
    featured: true,
    context:
      "Agencies receive inquiries through a contact form, email, and social messages. They arrive in different inboxes and are answered at different speeds, so the same lead is sometimes contacted twice — or not at all.",
    problem:
      "There is no single queue, no record of who replied, and no reminder when a message has been waiting too long. Follow-up depends on memory, and a promising inquiry can quietly go cold.",
    solution:
      "The concept normalises every channel into one inquiry record with a status, an owner, and a timestamp for the last contact. A scheduled job flags inquiries that have waited too long, and a notification is sent to the owner rather than to a shared inbox. Every status change is appended to a short activity log, so handoffs have context.",
    features: [
      "One queue for form, email, and manual entries",
      "Status and owner on every inquiry",
      "Automated reminder when a message has waited too long",
      "An activity log for handoffs and follow-ups",
      "Idempotent webhook handling so a repeated delivery cannot duplicate a lead",
    ],
    challenges: [
      "Email and form submissions arrive in different shapes; a normalisation step was needed before anything else could be automated.",
      "Automation must not send duplicate messages when a webhook is delivered twice — handled with an idempotency key and a unique index.",
    ],
    learnings: [
      "Most of the work in automation is defining the exceptions, not the happy path.",
      "A visible activity log makes an automated pipeline easier to trust and debug.",
    ],
  },
  {
    slug: "document-assistant-concept",
    title: "Document Assistant Concept",
    summary:
      "A concept for answering questions over a private set of documents, with citations and a human review step.",
    category: "AI integration",
    technologies: ["Next.js", "TypeScript", "Node.js", "Vector search"],
    status: "concept",
    isSample: true,
    featured: true,
    context:
      "Teams accumulate policies, contracts, and internal notes in folders that are easy to store and hard to search. Finding a specific clause often means opening several files and reading until it appears.",
    problem:
      "Keyword search misses paraphrased language, and a general-purpose chatbot has no access to the private documents — or invents an answer when it does not know one. For internal policy questions, a confident wrong answer is worse than no answer.",
    solution:
      "The concept indexes a defined document set and returns short answers with the source passage attached. If no passage passes a relevance threshold, it says so instead of guessing. Every answer links back to the source document, and an internal reviewer can flag an answer as unhelpful to improve the retrieval set.",
    features: [
      "Answers restricted to an approved document set",
      "A citation with every answer",
      "An explicit “not found” response when nothing relevant is retrieved",
      "Reviewer feedback stored separately from the source documents",
      "Uploads processed server-side, with keys kept out of the browser",
    ],
    challenges: [
      "Chunking documents without splitting a clause in half — handled with overlapping sections and a check that each chunk keeps its heading.",
      "Making “I do not know” a first-class outcome instead of letting the model fill the gap.",
    ],
    learnings: [
      "Retrieval quality decided the usefulness of the feature far more than prompt wording did.",
      "Citations are not decoration: without them, users cannot verify an answer and stop trusting the tool.",
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export const featuredProjects: Project[] = projects.filter(
  (project) => project.featured,
);

/** Categories for the client-side filter on /work, in a stable order. */
export const projectCategories: string[] = [
  "All",
  ...Array.from(new Set(projects.map((project) => project.category))),
];
