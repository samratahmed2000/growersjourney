import type { ReactNode } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/layout/wordmark";
import { LogoutButton } from "@/components/auth/logout-button";
import { Container } from "@/components/ui/container";
import { roleLabel, type SessionUser } from "@/lib/auth/roles";
import { PortalNav } from "./portal-nav";

/**
 * Client portal frame.
 *
 * The layout guard only proves the user has the CLIENT role. Every page still
 * calls the API, which additionally requires an explicit link to an active
 * client record. This shell must never imply access that the API would deny.
 */
export function PortalShell({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>

      <header className="border-b border-line bg-surface">
        <Container className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/" className="rounded-lg" aria-label="Growers Journy home">
                <Wordmark />
              </Link>
              <span className="rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-muted">
                Client portal
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-ink">{user.name}</p>
                <p className="break-all text-xs text-muted">
                  {roleLabel(user.role)} · {user.email}
                </p>
              </div>
              <LogoutButton />
            </div>
          </div>

          <div className="mt-4">
            <PortalNav />
          </div>
        </Container>
      </header>

      <main id="main-content" className="flex-1 py-8 sm:py-10">
        <Container>{children}</Container>
      </main>

      <footer className="border-t border-line py-5">
        <Container>
          <p className="text-xs text-muted">
            Growers Journy client portal. Project information is visible only to
            the linked client account.
          </p>
        </Container>
      </footer>
    </div>
  );
}
