import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Wordmark } from "@/components/layout/wordmark";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PRIMARY_NAV } from "@/lib/content/site";

/**
 * Sticky site header.
 *
 * Server Component: the only interactive parts are the two navigation
 * components, which are marked "use client" individually.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-20">
        <Link
          href="/"
          aria-label="Growers Journy — home"
          className="rounded-md"
        >
          <Wordmark />
        </Link>

        <DesktopNav items={PRIMARY_NAV} />

        <div className="flex items-center gap-2">
          <ButtonLink href="/contact" className="hidden sm:inline-flex">
            Discuss Your Project
          </ButtonLink>
          <MobileNav items={PRIMARY_NAV} />
        </div>
      </Container>
    </header>
  );
}
