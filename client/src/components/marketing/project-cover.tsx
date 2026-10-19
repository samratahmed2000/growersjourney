import type { Project } from "@/types/type";
import { cn } from "@/lib/utils";

/** "Operations Dashboard Concept" → "OD" */
function initialsOf(title: string): string {
  return title
    .split(" ")
    .filter((word) => /[a-z]/i.test(word))
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Stand-in cover image for portfolio entries.
 *
 * No real project screenshots exist, and using stock photography as if it were
 * the product would be misleading. So each entry gets a typographic cover with
 * a visible "Concept" label. Replace this component's output with a real image
 * once a project has one.
 */
export function ProjectCover({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) {
  const patternId = `cover-grid-${project.slug}`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-line bg-brand-900/5",
        className,
      )}
    >
      <svg aria-hidden="true" className="absolute inset-0 size-full text-brand-900/10">
        <defs>
          <pattern
            id={patternId}
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M32 0H0V32"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>

      <div className="relative grid aspect-[16/10] place-items-center">
        <span className="text-4xl font-semibold tracking-tight text-brand-900/25">
          {initialsOf(project.title)}
        </span>
      </div>

      {project.isSample ? (
        <span className="absolute left-3 top-3 rounded-md border border-line bg-surface/90 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-muted">
          Concept
        </span>
      ) : null}
    </div>
  );
}
