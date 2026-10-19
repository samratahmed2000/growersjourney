import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProjectCover } from "@/components/marketing/project-cover";
import { ProjectCard } from "@/components/marketing/project-card";
import { CtaBand } from "@/components/marketing/cta-band";
import { getProject, projects } from "@/lib/content/projects";

type ProjectPageProps = {
  // Next.js 16 passes params as a Promise that must be awaited.
  params: Promise<{ slug: string }>;
};

/** Prerender every project page at build time. */
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    return { title: "Project not found" };
  }

  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/work/${project.slug}` },
  };
}

const STATUS_LABELS: Record<string, string> = {
  concept: "Concept",
  "in-progress": "In progress",
  completed: "Completed",
};

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);

  // An unknown slug must render a real 404, not an empty page.
  if (!project) {
    notFound();
  }

  const relatedProjects = projects
    .filter((candidate) => candidate.slug !== project.slug)
    .slice(0, 2);

  return (
    <>
      <Container className="pt-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <li>
              <Link href="/" className="transition-colors hover:text-ink">
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3.5" />
            </li>
            <li>
              <Link href="/work" className="transition-colors hover:text-ink">
                Work
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3.5" />
            </li>
            <li aria-current="page" className="text-ink">
              {project.title}
            </li>
          </ol>
        </nav>
      </Container>

      <section className="border-b border-line bg-surface">
        <Container className="py-12 sm:py-14">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-14">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {project.isSample ? (
                  <Badge variant="accent">Sample concept</Badge>
                ) : null}
                <Badge>{project.category}</Badge>
                <Badge>{STATUS_LABELS[project.status] ?? project.status}</Badge>
              </div>

              <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {project.title}
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                {project.summary}
              </p>

              <ul className="mt-6 flex flex-wrap gap-2">
                {project.technologies.map((technology) => (
                  <li
                    key={technology}
                    className="rounded-md border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-muted"
                  >
                    {technology}
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-sm leading-relaxed text-muted">
                <Link
                  href="/work"
                  className="inline-flex items-center gap-1.5 font-medium text-accent-600 transition-colors hover:text-brand-900"
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  Back to all work
                </Link>
              </p>
            </div>

            <ProjectCover project={project} className="w-full" />
          </div>
        </Container>
      </section>

      {project.isSample ? (
        <Container className="pt-8">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
            <p className="font-semibold">This is sample content.</p>
            <p className="mt-1.5">
              The project below is a concept created to demonstrate an approach.
              It is not a delivered client project, and no client name, result,
              or metric is claimed for it.
            </p>
          </div>
        </Container>
      ) : null}

      <Section labelledBy="case-heading">
        <SectionHeading
          id="case-heading"
          eyebrow="The concept"
          title="Context, problem, and approach"
        />

        <div className="mt-10 grid max-w-4xl gap-10 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-600">
              Context
            </h3>
            <p className="mt-3 text-base leading-relaxed text-muted">
              {project.context}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-600">
              Problem
            </h3>
            <p className="mt-3 text-base leading-relaxed text-muted">
              {project.problem}
            </p>
          </div>
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-600">
              Approach
            </h3>
            <p className="mt-3 text-base leading-relaxed text-muted">
              {project.solution}
            </p>
          </div>
        </div>
      </Section>

      <Section labelledBy="features-heading" tone="surface">
        <SectionHeading
          id="features-heading"
          eyebrow="Scope"
          title="What the concept covers"
        />

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {project.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-3 rounded-xl border border-line bg-canvas p-5 text-sm leading-relaxed text-muted"
            >
              <Check
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-accent-600"
              />
              {feature}
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="decisions-heading">
        <SectionHeading
          id="decisions-heading"
          eyebrow="Engineering"
          title="Difficult decisions and what they taught"
          description="The parts that took real thought, recorded honestly — including the dead ends."
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
              Challenges
            </h3>
            <ul className="mt-4 space-y-4">
              {project.challenges.map((challenge) => (
                <li
                  key={challenge}
                  className="rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted"
                >
                  {challenge}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
              Learnings
            </h3>
            <ul className="mt-4 space-y-4">
              {project.learnings.map((learning) => (
                <li
                  key={learning}
                  className="rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted"
                >
                  {learning}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {relatedProjects.length > 0 ? (
        <Section labelledBy="related-heading" tone="surface">
          <SectionHeading
            id="related-heading"
            eyebrow="More concepts"
            title="Other sample projects"
          />
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:gap-8">
            {relatedProjects.map((related) => (
              <ProjectCard key={related.slug} project={related} />
            ))}
          </div>
        </Section>
      ) : null}

      <CtaBand />
    </>
  );
}
