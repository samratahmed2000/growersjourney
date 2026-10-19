import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { SITE } from "@/lib/content/site";

const CAPABILITIES = [
  "Web applications",
  "Business automation",
  "AI integration",
];

/**
 * Homepage hero.
 *
 * The headline is the brand tagline (per docs/DESIGN.md §8.1) and the accent
 * green is used as large text on a dark background, where it passes WCAG AA.
 */
export function Hero() {
  return (
    <section className="bg-brand-950 text-white">
      <Container className="grid gap-14 py-18 sm:py-22 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-28">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-white/75">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-accent-500"
            />
            {SITE.name} — digital agency
          </p>

          <h1 className="mt-6 text-balance text-[clamp(2.5rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
            Build Smarter.
            <br />
            <span className="text-accent-500">Grow Faster.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
            {SITE.description}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/contact" size="lg">
              Discuss Your Project
            </ButtonLink>
            <ButtonLink href="/work" size="lg" variant="inverse">
              Explore Our Work
            </ButtonLink>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-sm text-white/60">
            {CAPABILITIES.map((capability) => (
              <li key={capability} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-1 rounded-full bg-accent-500"
                />
                {capability}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </Container>
    </section>
  );
}
