import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "neutral" | "accent" | "brand";

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: "border-line bg-canvas text-muted",
  accent: "border-accent-500/30 bg-accent-500/10 text-accent-600",
  brand: "border-brand-900 bg-brand-900 text-white",
};

/**
 * Small label used for categories, technologies, and the "Concept" marker on
 * sample portfolio content.
 */
export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
