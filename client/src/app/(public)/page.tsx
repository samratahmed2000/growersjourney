import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/marketing/hero";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { ServiceCard } from "@/components/marketing/service-card";
import { ProjectCard } from "@/components/marketing/project-card";
import { Differentiators } from "@/components/marketing/differentiators";
import { ProcessSteps } from "@/components/marketing/process-steps";
import { FounderNote } from "@/components/marketing/founder-note";
import { TechStrip } from "@/components/marketing/tech-strip";
import { Faq } from "@/components/marketing/faq";
import { CtaBand } from "@/components/marketing/cta-band";
import { services } from "@/lib/content/services";
import { featuredProjects } from "@/lib/content/projects";
import { processSteps } from "@/lib/content/process";
import {
  DIFFERENTIATORS,
  FAQ_ITEMS,
  SITE,
  TECH_STACK,
} from "@/lib/content/site";

const INLINE_LINK =
  "inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 transition-colors hover:text-brand-900";

export const metadata: Metadata = {
  // Absolute title: the root template would otherwise append the brand twice.
  title: { absolute: `${SITE.name} — ${SITE.tagline}` },
  description: SITE.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* 1. Services */}
      <Section labelledBy="services-heading">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="services-heading"
            eyebrow="Services"
            title="Three ways we help businesses grow"
            description="Start with the problem, then choose the smallest system that solves it — a web application, an automated workflow, or an AI feature with a human in the loop."
          />
          <Link href="/services" className={INLINE_LINK}>
            View all services
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </Section>

      {/* 2. Selected concept work */}
      <Section labelledBy="work-heading" tone="surface">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="work-heading"
            eyebrow="Selected work"
            title="Concept projects, honestly labelled"
            description="These are design and engineering concepts, not delivered client work. They exist to show how problems are approached, and each one is marked as sample content."
          />
          <Link href="/work" className={INLINE_LINK}>
            Explore all work
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {featuredProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </Section>

      {/* 3. Differentiators */}
      <Section labelledBy="approach-heading">
        <SectionHeading
          id="approach-heading"
          eyebrow="Approach"
          title="Why work with Growers Journy"
          description="A small set of working principles, applied to every project. No inflated claims — just the way the work is done."
        />
        <div className="mt-12">
          <Differentiators items={DIFFERENTIATORS} />
        </div>
      </Section>

      {/* 4. Process */}
      <Section labelledBy="process-heading" tone="surface">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="process-heading"
            eyebrow="Process"
            title="A clear path from problem to launch"
            description="Six steps, each with something you can review. You always know what is happening and what comes next."
          />
          <Link href="/process" className={INLINE_LINK}>
            See the full process
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <div className="mt-12">
          <ProcessSteps steps={processSteps} />
        </div>
      </Section>

      {/* 5. Founder */}
      <Section labelledBy="founder-heading">
        <SectionHeading
          id="founder-heading"
          eyebrow="Who you work with"
          title="Led by the person who builds it"
          description="Not a sales team and an outsourced build. The same person who scopes the project writes the code."
        />
        <div className="mt-10">
          <FounderNote />
        </div>
      </Section>

      {/* 6. Technology */}
      <Section labelledBy="tools-heading" tone="surface" spacing="sm">
        <h2 id="tools-heading" className="sr-only">
          Technology stack
        </h2>
        <TechStrip items={TECH_STACK} />
      </Section>

      {/* 7. FAQ */}
      <Section labelledBy="faq-heading">
        <SectionHeading
          id="faq-heading"
          eyebrow="Questions"
          title="Answers before you get in touch"
          description="Straight answers about scope, working together, and where AI genuinely helps."
        />
        <div className="mt-10">
          <Faq items={FAQ_ITEMS} />
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
