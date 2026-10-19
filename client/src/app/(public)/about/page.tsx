import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { TechStrip } from "@/components/marketing/tech-strip";
import { CtaBand } from "@/components/marketing/cta-band";
import { ButtonLink } from "@/components/ui/button";
import { SITE, TECH_STACK } from "@/lib/content/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Growers Journy is an independent digital agency building web applications, automation, and AI features. Led by founder Samrat Ahmed.",
  alternates: { canonical: "/about" },
};

const COMMITMENTS = [
  "A written scope before development starts — including what is deliberately out of scope.",
  "No invented statistics, testimonials, or client logos anywhere on this site.",
  "Server-side validation on every endpoint that accepts input, and no secrets in the browser.",
  "Plain-language updates, with the working build available to review.",
  "A handover that documents environment variables, setup, and known limitations.",
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="An independent agency built around useful software"
        description="Growers Journy builds web applications, automates repetitive work, and integrates AI where it genuinely helps. The focus is on solving a specific problem well, rather than shipping features nobody asked for."
      >
        <ButtonLink href="/contact" size="lg">
          Discuss Your Project
        </ButtonLink>
      </PageHero>

      <Section labelledBy="mission-heading">
        <SectionHeading
          id="mission-heading"
          eyebrow="Purpose"
          title="What the work is for"
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface p-6 sm:p-8">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-600">
              Mission
            </h3>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Give small and mid-sized businesses access to the kind of internal
              tooling larger companies take for granted — without the complexity,
              the jargon, or a system nobody can maintain after launch.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-6 sm:p-8">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-600">
              Vision
            </h3>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Software that quietly removes the repetitive parts of a working
              day: the re-typing, the chasing, the searching through files. The
              best compliment a build can get is that it stops being noticed
              because it simply works.
            </p>
          </div>
        </div>
      </Section>

      <Section labelledBy="founder-heading" tone="surface">
        <SectionHeading
          id="founder-heading"
          eyebrow="Founder"
          title={SITE.founder.name}
          description={SITE.founder.title}
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[auto_1fr] lg:gap-12">
          <div className="flex items-center gap-4 lg:block">
            <span
              aria-hidden="true"
              className="grid size-20 shrink-0 place-items-center rounded-2xl bg-brand-900 text-xl font-semibold text-white"
            >
              SA
            </span>
            <p className="max-w-[10rem] text-xs leading-relaxed text-muted lg:mt-4">
              Placeholder monogram — a real portrait will replace it once one is
              supplied.
            </p>
          </div>

          <div className="max-w-2xl space-y-4">
            <p className="text-base leading-relaxed text-ink/85">
              {SITE.founder.bio}
            </p>
            <blockquote className="border-l-2 border-accent-500 pl-5 text-base leading-relaxed text-muted">
              {SITE.founder.philosophy}
            </blockquote>
            <p className="text-sm leading-relaxed text-muted">
              Every project is delivered in-house. Nothing here claims a team
              size, a client count, or a track record: this page describes how
              the work is done, and the concepts in the portfolio are labelled
              as sample content rather than presented as past clients.
            </p>
          </div>
        </div>
      </Section>

      <Section labelledBy="commitments-heading">
        <SectionHeading
          id="commitments-heading"
          eyebrow="Commitments"
          title="What you can expect on every project"
        />

        <ul className="mt-10 grid max-w-3xl gap-4">
          {COMMITMENTS.map((commitment) => (
            <li
              key={commitment}
              className="flex items-start gap-3 text-base leading-relaxed text-muted"
            >
              <Check
                aria-hidden="true"
                className="mt-1 size-4 shrink-0 text-accent-600"
              />
              {commitment}
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="stack-heading" tone="surface" spacing="sm">
        <h2 id="stack-heading" className="sr-only">
          Technology approach
        </h2>
        <TechStrip items={TECH_STACK} title="Technology approach" />
      </Section>

      <CtaBand />
    </>
  );
}
