import type {
  Differentiator,
  FaqItem,
  NavItem,
} from "@/types/type";

/**
 * Site-wide content: brand facts, navigation, contact details, and the copy
 * that appears in more than one place.
 *
 * One source of truth on purpose — the header, footer, contact form, and page
 * metadata all read from here, so a detail never has to be updated twice.
 */

export const SITE = {
  name: "Growers Journy",
  tagline: "Build Smarter. Grow Faster.",
  /** Used for the meta description and the footer summary. */
  description:
    "Growers Journy builds modern web applications, automates business workflows, and integrates AI to help businesses solve problems and grow with confidence.",
  founder: {
    name: "Samrat Ahmed",
    title: "AI-Driven Web Application Engineer (MERN)",
    /**
     * Neutral copy: it states what the founder does on this project and makes
     * no claims about years of experience, client count, or results.
     */
    bio: "Samrat Ahmed is the founder of Growers Journy. He works across the stack — shaping the interface, building the API, and integrating automation and AI where they serve a real business need.",
    philosophy:
      "Software should remove work, not create it. Every project starts with the problem, then the smallest reliable system that solves it. Clear scope, readable code, and honest documentation matter as much as the feature itself.",
  },
  contact: {
    email: "info.growersjourney@gmail.com",
    phone: "+8801318208446",
    phoneDisplay: "+880 1318 208446",
  },
  /**
   * A constant instead of `new Date()`: Cache Components flags runtime clock
   * reads, and a copyright year does not need to be read per request.
   * Update this when the year changes.
   */
  copyrightYear: 2026,
} as const;

const FALLBACK_SITE_URL = "http://localhost:3000";

/**
 * Absolute base URL for canonical links, Open Graph tags, and the sitemap.
 * Taken from a non-secret public variable, with a local fallback so the app
 * never crashes on a malformed or missing value.
 */
export function siteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!raw) {
    return new URL(FALLBACK_SITE_URL);
  }

  try {
    return new URL(raw);
  } catch {
    return new URL(FALLBACK_SITE_URL);
  }
}

/** Header navigation. The logo links home, so "Home" is not repeated here. */
export const PRIMARY_NAV: NavItem[] = [
  { label: "Services", href: "/services" },
  { label: "Work", href: "/work" },
  { label: "About", href: "/about" },
  { label: "Process", href: "/process" },
];

export const FOOTER_NAV: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Process", href: "/process" },
      { label: "Our Work", href: "/work" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Services",
    items: [
      {
        label: "Web Application Development",
        href: "/services#web-application-development",
      },
      { label: "Business Automation", href: "/services#business-automation" },
      { label: "AI Integration", href: "/services#ai-integration" },
    ],
  },
];

/** Working principles. Descriptions describe approach, not achievements. */
export const DIFFERENTIATORS: Differentiator[] = [
  {
    title: "Business-first scope",
    description:
      "Each feature is tied to a problem worth solving. If something is not needed for the first release, it is written down and postponed rather than quietly added.",
    icon: "target",
  },
  {
    title: "A stack that stays maintainable",
    description:
      "Next.js, React, TypeScript, Node.js, Express, and MongoDB. Widely documented tools, so the next developer can pick the project up without a private framework.",
    icon: "layers",
  },
  {
    title: "Clear communication",
    description:
      "A written scope, visible progress on a working build, and plain language instead of status reports full of jargon.",
    icon: "communication",
  },
  {
    title: "Responsive and accessible",
    description:
      "Layouts start at the smallest screen and are checked with a keyboard, not just a mouse. Focus states and labels are part of the build, not a later fix.",
    icon: "responsive",
  },
  {
    title: "Built to be handed over",
    description:
      "Readable code, documented environment variables, and setup notes, so the project is not dependent on one person to run it.",
    icon: "maintenance",
  },
  {
    title: "Practical AI, not decoration",
    description:
      "AI is used where it reduces repetitive work, with a defined failure path and a human check wherever the output matters.",
    icon: "automation",
  },
];

/** Tools genuinely used in this project's stack. No logo images are implied. */
export const TECH_STACK: string[] = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Node.js",
  "Express",
  "MongoDB",
  "Mongoose",
  "Zod",
];

/** Honest answers only — no promised timelines, prices, or guarantees. */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What kinds of projects do you take on?",
    answer:
      "Web applications, internal tools, business automation, and AI-assisted features. If a request falls outside that scope, it is said plainly rather than accepted and quietly outsourced.",
  },
  {
    question: "How does a project start?",
    answer:
      "With a written scope: the problem, the people who will use it, what is in scope, what is not, and the constraints. Development begins once that scope is agreed.",
  },
  {
    question: "Can you work with an existing codebase?",
    answer:
      "If it can be read and run, yes. The first step is a review. The honest answer may sometimes be that replacing a small, unstable module is cheaper than patching it.",
  },
  {
    question: "Where does AI actually help?",
    answer:
      "Usually in repetitive reading, sorting, and drafting: triaging incoming messages, extracting details from documents, or producing a first draft for a person to check. Each AI feature needs a defined use case and a safe failure path.",
  },
  {
    question: "How do we stay in touch during a project?",
    answer:
      "Through regular checkpoints where you review a working build rather than a status message. Questions and changes are recorded so both sides share the same picture.",
  },
  {
    question: "What happens after launch?",
    answer:
      "Handover includes setup notes, documented environment variables, and a walkthrough of how the system works. Ongoing maintenance can be arranged separately if it is needed.",
  },
];
