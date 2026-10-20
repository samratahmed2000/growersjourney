"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  LayoutDashboard,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] =
  [
    { href: "/portal", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/portal/projects", label: "Projects", icon: FolderKanban },
    { href: "/portal/invoices", label: "Invoices", icon: ReceiptText },
  ];

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Client portal"
      className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1"
    >
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand-900 text-white"
                : "text-muted hover:bg-canvas hover:text-ink",
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
