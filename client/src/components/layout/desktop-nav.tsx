"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/types/type";
import { cn } from "@/lib/utils";

/**
 * Desktop navigation.
 *
 * This is a Client Component only because the active link needs the current
 * pathname. The rest of the header stays a Server Component.
 */
export function DesktopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full",
                  isActive
                    ? "text-brand-900 after:bg-accent-500"
                    : "text-muted after:bg-transparent hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
