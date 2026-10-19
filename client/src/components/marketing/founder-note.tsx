import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SITE } from "@/lib/content/site";

/**
 * Founder note. The monogram stands in for a portrait that has not been
 * supplied; drop a real photo in public/images/brand/ and swap the span for
 * next/image when one is available.
 */
export function FounderNote() {
  return (
    <div className="grid gap-6 rounded-2xl border border-line bg-surface p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-start lg:gap-10">
      <div className="flex items-center gap-4 lg:block">
        <span
          aria-hidden="true"
          className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-900 text-lg font-semibold text-white"
        >
          SA
        </span>
        <div className="lg:mt-5">
          <p className="text-base font-semibold text-ink">
            {SITE.founder.name}
          </p>
          <p className="text-sm text-muted">{SITE.founder.title}</p>
        </div>
      </div>

      <div>
        <p className="text-base leading-relaxed text-ink/90">
          {SITE.founder.philosophy}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {SITE.founder.bio}
        </p>
        <Link
          href="/about"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 transition-colors hover:text-brand-900"
        >
          More about Growers Journy
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </div>
  );
}
