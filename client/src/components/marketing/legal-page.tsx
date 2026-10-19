import type { LegalSection } from "@/types/type";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";

/**
 * Shared renderer for /privacy-policy and /terms.
 *
 * The review banner is not optional: neither page has been checked against a
 * real jurisdiction, and the copy contains bracketed placeholders that must be
 * resolved before launch.
 */
export function LegalPage({
  title,
  description,
  lastUpdated,
  sections,
}: {
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHero eyebrow="Legal" title={title} description={description} />

      <Container className="py-14 sm:py-16">
        <div className="max-w-[760px]">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <p className="font-semibold">
              Draft template — requires legal review before launch.
            </p>
            <p className="mt-1.5 leading-relaxed">
              This page describes how the site is intended to operate today.
              Anything in square brackets must be confirmed, and the whole page
              should be reviewed against the rules that apply where you operate.
              It is not legal advice.
            </p>
          </div>

          <p className="mt-8 text-sm text-muted">
            Last updated: {lastUpdated}
          </p>

          <div className="mt-10 space-y-10">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-heading`}
              >
                <h2
                  id={`${section.id}-heading`}
                  className="text-xl font-semibold tracking-tight text-ink"
                >
                  {section.heading}
                </h2>

                <div className="mt-3 space-y-3">
                  {section.paragraphs.map((paragraph, index) => (
                    <p
                      key={`${section.id}-p-${index}`}
                      className="text-sm leading-relaxed text-muted"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                {section.bullets && section.bullets.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
                    {section.bullets.map((bullet, index) => (
                      <li key={`${section.id}-b-${index}`}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
