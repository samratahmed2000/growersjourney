import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function CtaBand() {
  return (
    <section className="bg-brand-950 text-white">
      <Container className="py-16 sm:py-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <div className="max-w-2xl">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Have a Project in Mind? Let&apos;s Build Something Useful.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/65">
              A short description of the problem is enough to start. If the
              project is a good fit, the next step is a written scope; if it is
              not, you will be told plainly.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
            <ButtonLink href="/contact" size="lg">
              Discuss Your Project
            </ButtonLink>
            <ButtonLink href="/services" size="lg" variant="inverse">
              View Services
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
