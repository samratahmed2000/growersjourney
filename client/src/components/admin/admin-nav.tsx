"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  FolderKanban,
  Images,
  Inbox,
  Layers,
  LayoutDashboard,
  ReceiptText,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ADMIN_NAV, type AdminNavItem } from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

const ICONS: Record<AdminNavItem["icon"], LucideIcon> = {
  dashboard: LayoutDashboard,
  inquiries: Inbox,
  clients: Users,
  projects: FolderKanban,
  invoices: ReceiptText,
  payments: CreditCard,
  services: Layers,
  portfolio: Images,
};

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="space-y-1">
      {ADMIN_NAV.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = ICONS[item.icon];

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand-900 text-white"
                : "text-muted hover:bg-canvas hover:text-ink",
            )}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
