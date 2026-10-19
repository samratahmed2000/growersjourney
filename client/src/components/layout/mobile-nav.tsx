"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Menu, Phone, X } from "lucide-react";
import type { NavItem } from "@/types/type";
import { SITE } from "@/lib/content/site";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

/**
 * Mobile navigation.
 *
 * Deliberate choices for accessibility:
 * - a real <button> with aria-expanded and aria-controls;
 * - the panel is removed with the `hidden` attribute, so it is not focusable
 *   or readable by screen readers while closed;
 * - Escape closes it, and so does navigating to another page;
 * - it is a disclosure panel below the header rather than a full-screen
 *   overlay, so it needs no focus trap and never traps the keyboard.
 */
export function MobileNav({ items }: { items: NavItem[] }) {
  /**
   * The panel remembers *which* path it was opened on, instead of a boolean
   * plus an effect that resets it. When the route changes, `pathname` no longer
   * matches, so the panel is closed automatically — no effect, no cascading
   * render, and the back/forward buttons behave correctly too.
   */
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const pathname = usePathname();
  const open = openForPath === pathname;
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenForPath(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpenForPath(open ? null : pathname)}
        className="grid size-10 place-items-center rounded-lg border border-line bg-surface text-ink transition-colors hover:border-brand-900/25"
      >
        {open ? (
          <X aria-hidden="true" className="size-5" />
        ) : (
          <Menu aria-hidden="true" className="size-5" />
        )}
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-line bg-surface shadow-sm lg:hidden"
      >
        <Container className="py-4">
          <nav aria-label="Mobile">
            <ul className="flex flex-col">
              {items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-between border-b border-line/70 py-3 text-base font-medium",
                        isActive ? "text-brand-900" : "text-ink",
                      )}
                    >
                      {item.label}
                      {isActive ? (
                        <span
                          aria-hidden="true"
                          className="size-1.5 rounded-full bg-accent-500"
                        />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <ButtonLink href="/contact" className="mt-4 w-full">
            Discuss Your Project
          </ButtonLink>

          <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <a
              href={`mailto:${SITE.contact.email}`}
              className="flex items-center gap-2 py-1 text-muted hover:text-ink"
            >
              <Mail aria-hidden="true" className="size-4 shrink-0" />
              <span className="break-all">{SITE.contact.email}</span>
            </a>
            <a
              href={`tel:${SITE.contact.phone}`}
              className="flex items-center gap-2 py-1 text-muted hover:text-ink"
            >
              <Phone aria-hidden="true" className="size-4 shrink-0" />
              {SITE.contact.phoneDisplay}
            </a>
          </div>
        </Container>
      </div>
    </div>
  );
}
