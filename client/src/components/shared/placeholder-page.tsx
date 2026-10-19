import { Info } from "lucide-react";

/**
 * Shared, honest stub for areas that are planned but not built.
 *
 * These routes exist so the application compiles and so a visitor who guesses a
 * URL gets a clear explanation instead of a broken page. They are excluded from
 * search indexing in robots.ts and are not linked from the public navigation.
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
    <main className="mx-auto flex min-h-[70vh] w-full max-w-[720px] flex-col justify-center px-5 py-16 sm:px-6">
      <p className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
        <Info aria-hidden="true" className="size-3.5" />
        Not implemented yet
      </p>

      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-ink">
        {title}
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-muted">
        {description ??
          `${area} is planned for a later task. No functionality is available here yet, and this page is not linked from the public website.`}
      </p>
    </main>
  );
}
