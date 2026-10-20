import type { ReactNode } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/layout/wordmark";
import { Container } from "@/components/ui/container";
import {
  areaLabel,
  roleLabel,
  type AuthArea,
  type SessionUser,
} from "@/lib/auth/roles";
import { LogoutButton } from "./logout-button";

/**
 * Minimal authenticated shell.
 *
 * This is intentionally not a dashboard: it only provides the identity, sign-out
 * control, and page frame that every protected page needs. The actual admin and
 * portal features remain unimplemented and are explicitly out of Task 06 scope.
 */
export function AreaShell({
  area,
  user,
  children,
}: {
  area: AuthArea;
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
        <Container className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-lg"
              aria-label="Growers Journy home"
            >
              <Wordmark />
            </Link>
            <span className="rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-muted">
              {areaLabel(area)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-ink">{user.name}</p>
              <p className="text-xs text-muted">
                {roleLabel(user.role)} · {user.email}
              </p>
            </div>
            <LogoutButton className="flex flex-col items-end" />
          </div>
        </Container>
      </header>

      <main id="main-content" className="flex-1 py-10">
        <Container>{children}</Container>
      </main>
    </div>
  );
}
