import type { Metadata } from "next";
import { Check, CircleDot } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { CtaBand } from "@/components/marketing/cta-band";
import { services } from "@/lib/content/services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Web application development, business automation, and AI integration — scoped, built, and documented by Growers Journy.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Web applications, business automation, and practical AI"
        description="Every engagement starts with the problem rather than a technology. These are the three areas the work falls into; if your project sits outside them, you will be told clearly."
      >
        <ButtonLink href="/contact" size="lg">
          Discuss Your Project
        </ButtonLink>
      </PageHero>

      {services.map((service, index) => (
        <section
          key={service.slug}
          id={service.slug}
          aria-labelledby={`${service.slug}-heading`}
          className={index % 2 === 1 ? "bg-surface" : undefined}
        >
          <Container className="py-14 sm:py-18">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
              <div>
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-brand-900/5 text-brand-900">
                    <Icon name={service.icon} className="size-5" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Service {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h2
                  id={`${service.slug}-heading`}
                  className="mt-5 text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
                >
                  {service.title}
                </h2>

                <p className="mt-4 text-base leading-relaxed text-ink/80">
                  {service.summary}
                </p>

                <div className="mt-6 rounded-xl border border-line bg-canvas p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Who it is for
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {service.audience}
                  </p>
                </div>

                <div className="mt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Tools used
                  </h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {service.technologies.map((technology) => (
                      <li
                        key={technology}
                        className="rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-medium text-muted"
                      >
                        {technology}
                      </li>
                    ))}
                  </ul>
                </div>

                <ButtonLink href="/contact" className="mt-7">
                  Start a conversation
                </ButtonLink>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:content-start">
                <div className="rounded-xl border border-line bg-surface p-6">
                  <h3 className="text-sm font-semibold text-ink">
                    Problems this solves
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {service.problems.map((problem) => (
                      <li
                        key={problem}
                        className="flex items-start gap-2.5 text-sm leading-relaxed text-muted"
                      >
                        <CircleDot
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-brand-900/70"
                        />
                        {problem}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-line bg-surface p-6">
                  <h3 className="text-sm font-semibold text-ink">
                    What you get
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {service.deliverables.map((deliverable) => (
                      <li
                        key={deliverable}
                        className="flex items-start gap-2.5 text-sm leading-relaxed text-muted"
                      >
                        <Check
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-accent-600"
                        />
                        {deliverable}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-line bg-surface p-6 sm:col-span-2">
                  <h3 className="text-sm font-semibold text-ink">
                    Typical capabilities
                  </h3>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {service.capabilities.map((capability) => (
                      <li
                        key={capability}
                        className="flex items-start gap-2.5 text-sm leading-relaxed text-muted"
                      >
                        <Check
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-accent-600"
                        />
                        {capability}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Container>
        </section>
      ))}

      <CtaBand />
    </>
  );
}
