import type { ReactNode } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/layout/wordmark";
import { LogoutButton } from "@/components/auth/logout-button";
import { roleLabel, type SessionUser } from "@/lib/auth/roles";
import { AdminNav } from "./admin-nav";
import { AdminMobileNav } from "./admin-mobile-nav";

/**
 * Admin dashboard frame: persistent desktop sidebar, mobile disclosure, and a
 * single main landmark.
 */
export function AdminShell({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas print:bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>

      <div className="print:hidden">
        <AdminMobileNav user={user} />
      </div>

      <div className="lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="hidden border-r border-line bg-surface lg:flex lg:sticky lg:top-0 lg:h-screen lg:flex-col print:hidden">
          <div className="border-b border-line p-5">
            <Link
              href="/"
              className="inline-flex rounded-lg"
              aria-label="Growers Journy home"
            >
              <Wordmark />
            </Link>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted">
              Admin dashboard
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <AdminNav />
          </div>

          <div className="border-t border-line p-4">
            <p className="truncate text-sm font-medium text-ink">{user.name}</p>
            <p className="mt-1 break-all text-xs text-muted">
              {roleLabel(user.role)} · {user.email}
            </p>
            <LogoutButton className="mt-3" />
          </div>
        </aside>

        <main id="main-content" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:p-0">
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
