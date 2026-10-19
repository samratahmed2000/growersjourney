import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProcessSteps } from "@/components/marketing/process-steps";
import { CtaBand } from "@/components/marketing/cta-band";
import { ButtonLink } from "@/components/ui/button";
import { processSteps } from "@/lib/content/process";

export const metadata: Metadata = {
  title: "Process",
  description:
    "How Growers Journy works: discover, plan, design, build, test, then launch and hand over — with something reviewable at every step.",
  alternates: { canonical: "/process" },
};

const PRINCIPLES = [
  {
    title: "Scope before code",
    description:
      "Nothing is built until the problem, the users, and the boundaries are written down and agreed.",
  },
  {
    title: "Working builds, not status reports",
    description:
      "Progress is shown as something you can click, on a build that runs, rather than as a percentage.",
  },
  {
    title: "One feature, finished",
    description:
      "A feature includes its empty, loading, and error states before the next one starts. Half-finished work is not hidden behind a demo.",
  },
  {
    title: "Write it down",
    description:
      "Decisions, environment variables, and known limitations are documented, so the project does not depend on memory.",
  },
];

export default function ProcessPage() {
  return (
    <>
      <PageHero
        eyebrow="Process"
        title="From first conversation to a system you can run"
        description="A predictable six-step path. No step is skipped silently, and each one ends with something concrete you can review or keep."
      >
        <ButtonLink href="/contact" size="lg">
          Start with a conversation
        </ButtonLink>
      </PageHero>

      <Section labelledBy="steps-heading">
        <SectionHeading
          id="steps-heading"
          eyebrow="Steps"
          title="How a project moves forward"
          description="The same sequence is used whether the work is a new application, an automation, or an AI feature."
        />

        <div className="mt-10">
          <ProcessSteps steps={processSteps} detailed />
        </div>
      </Section>

      <Section labelledBy="principles-heading" tone="surface">
        <SectionHeading
          id="principles-heading"
          eyebrow="Principles"
          title="Rules the process follows"
        />

        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {PRINCIPLES.map((principle) => (
            <li
              key={principle.title}
              className="rounded-xl border border-line bg-canvas p-6"
            >
              <h3 className="text-base font-semibold tracking-tight text-ink">
                {principle.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {principle.description}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand />
    </>
  );
}
