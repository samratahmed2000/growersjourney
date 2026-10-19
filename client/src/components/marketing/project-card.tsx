import Link from "next/link";
import type { Project } from "@/types/type";
import { Badge } from "@/components/ui/badge";
import { ProjectCover } from "@/components/marketing/project-cover";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="flex h-full flex-col">
      {/* Decorative duplicate of the title link, removed from the tab order and
          from the accessibility tree so screen readers hear one link per card. */}
      <Link
        href={`/work/${project.slug}`}
        tabIndex={-1}
        aria-hidden="true"
        className="rounded-xl"
      >
        <ProjectCover project={project} />
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {project.isSample ? (
          <Badge variant="accent">Sample concept</Badge>
        ) : null}
        <Badge>{project.category}</Badge>
      </div>

      <h3 className="mt-3 text-lg font-semibold tracking-tight text-ink">
        <Link
          href={`/work/${project.slug}`}
          className="transition-colors hover:text-accent-600"
        >
          {project.title}
        </Link>
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-muted">
        {project.summary}
      </p>

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {project.technologies.map((technology) => (
          <li
            key={technology}
            className="rounded-md border border-line bg-canvas px-2 py-0.5 text-[0.7rem] text-muted"
          >
            {technology}
          </li>
        ))}
      </ul>
    </article>
  );
}
