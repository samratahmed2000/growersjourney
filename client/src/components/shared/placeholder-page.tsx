import { Info } from "lucide-react";

/**
 * Shared, honest stub for areas that are planned but not built.
 *
 * These routes exist so the application compiles and so an authenticated user
 * who opens an unfinished feature gets a clear explanation instead of a broken
 * page. They are excluded from search indexing in robots.ts and are not linked
 * from the public navigation.
 *
 * The root is a `<div>`, not `<main>`: the admin and portal shells already
 * provide the single `<main>` landmark around their children.
 */
export function PlaceholderPage({
  area,
  title,
  description,
}: {
  area: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[50vh] w-full max-w-[720px] flex-col justify-center py-8">
      <p className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
        <Info aria-hidden="true" className="size-3.5" />
        Not implemented yet
      </p>

      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-ink">
        {title}
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-muted">
        {description ??
          `${area} is planned for a later task. This page sits behind authentication, but the feature itself is not available yet.`}
      </p>
    </div>
  );
}
