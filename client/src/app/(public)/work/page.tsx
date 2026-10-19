import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { ProjectFilter } from "@/components/marketing/project-filter";
import { CtaBand } from "@/components/marketing/cta-band";
import { projectCategories, projects } from "@/lib/content/projects";

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "Concept projects from Growers Journy — clearly labelled sample work showing how web applications, automation, and AI features are approached.",
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  return (
    <>
      <PageHero
        eyebrow="Portfolio"
        title="Concept projects and what they explore"
        description="No client work is published without written permission, and none has been approved yet. So this page shows clearly labelled concepts instead of borrowed screenshots or invented case studies."
      />

      <Section>
        <div className="rounded-xl border border-brand-900/15 bg-brand-900/5 p-5 text-sm leading-relaxed text-ink/80 sm:p-6">
          <p className="font-semibold text-ink">
            All projects on this page are sample concepts.
          </p>
          <p className="mt-1.5">
            Each entry is a design and engineering exercise created to
            demonstrate an approach. They are not delivered client projects, and
            no results, testimonials, or metrics are claimed for them. Real work
            will replace these entries one at a time, once a client approves it.
          </p>
        </div>

        <div className="mt-10">
          <ProjectFilter projects={projects} categories={projectCategories} />
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
