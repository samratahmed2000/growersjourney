import type { ProcessStep } from "@/types/type";

/**
 * The six-step engagement process.
 *
 * The steps describe how the work is organised. They deliberately avoid
 * promised durations and guaranteed outcomes.
 */
export const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Discover",
    icon: "search",
    summary: "Understand the problem before proposing a solution.",
    details:
      "The first conversation is about the work itself: what is slow, what is unclear, and what has already been tried. The goal is to separate the symptom from the cause, and to agree on what a useful outcome would look like before any interface is discussed.",
    deliverables: [
      "A short written problem statement",
      "A list of the people who will use the system",
      "Known constraints: budget, tools, timeline, and existing systems",
    ],
  },
  {
    number: "02",
    title: "Plan",
    icon: "planning",
    summary: "Turn the problem into a scoped, testable first release.",
    details:
      "The scope is written down, including what is deliberately excluded. Data models, user roles, and the main screens are sketched so the build has a shared reference. Anything that can wait for a second release is listed rather than quietly dropped.",
    deliverables: [
      "A scope document with in-scope and out-of-scope items",
      "A data model and a list of the main user flows",
      "An agreed definition of done for the first release",
    ],
  },
  {
    number: "03",
    title: "Design",
    icon: "design",
    summary: "Shape the interface around the tasks people repeat.",
    details:
      "Layouts start from the smallest screen and the most common task. The design covers states that are easy to forget: empty, loading, error, and no-permission. The result is a set of screens that are practical to build, not a decorative mockup that has to be reinterpreted later.",
    deliverables: [
      "Responsive layouts for the core screens",
      "Documented empty, loading, and error states",
      "A small set of reusable interface components",
    ],
  },
  {
    number: "04",
    title: "Build",
    icon: "build",
    summary: "Small increments, visible on a working build.",
    details:
      "Development happens in short increments against a running application, so progress is reviewable rather than described. Input is validated on the server, secrets stay on the server, and each feature is finished — including its error path — before the next one starts.",
    deliverables: [
      "A working build updated through the project",
      "A typed codebase with the main decisions documented",
      "Server-side validation on every endpoint that accepts input",
    ],
  },
  {
    number: "05",
    title: "Test",
    icon: "quality",
    summary: "Check the boring cases that decide whether it is usable.",
    details:
      "Testing covers the paths people actually take, plus the ones they only take when something goes wrong: bad input, expired sessions, duplicate submissions, and slow connections. Accessibility is checked with a keyboard and a screen reader, not only a visual review.",
    deliverables: [
      "A written list of what was tested and what was not",
      "Fixes for the issues found during the review",
      "A final check against the agreed definition of done",
    ],
  },
  {
    number: "06",
    title: "Launch & Support",
    icon: "launch",
    summary: "Hand over a system someone else can run and extend.",
    details:
      "Deployment is treated as part of the work, not an afterthought. Environment variables, database access, and backup expectations are documented before launch. After handover, maintenance can be arranged separately, and further features go through the same scoping step.",
    deliverables: [
      "Deployment and environment documentation",
      "A handover walkthrough of the running system",
      "A list of known limitations and sensible next steps",
    ],
  },
];
