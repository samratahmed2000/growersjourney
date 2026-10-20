"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/layout/wordmark";
import { LogoutButton } from "@/components/auth/logout-button";
import { roleLabel, type SessionUser } from "@/lib/auth/roles";
import { AdminNav } from "./admin-nav";

/**
 * Mobile admin disclosure.
 *
 * The panel is removed with `hidden` while closed, so its links cannot receive
 * focus. It closes on Escape and after navigating to another page.
 */
export function AdminMobileNav({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const panelId = useId();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenPath(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
        <Link href="/admin" aria-label="Growers Journy admin" className="rounded-lg">
          <Wordmark />
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpenPath(open ? null : pathname)}
          className="inline-flex size-10 items-center justify-center rounded-lg border border-line text-ink hover:bg-canvas"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>

      <div id={panelId} hidden={!open} className="border-b border-line bg-surface p-4">
        <AdminNav onNavigate={() => setOpenPath(null)} />
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-sm font-medium text-ink">{user.name}</p>
          <p className="mt-1 break-all text-xs text-muted">
            {roleLabel(user.role)} · {user.email}
          </p>
          <LogoutButton className="mt-3" />
        </div>
      </div>
    </div>
  );
}
