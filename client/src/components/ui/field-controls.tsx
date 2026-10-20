import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

const CONTROL =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink shadow-sm outline-none transition-colors placeholder:text-muted/70 focus-visible:border-accent-600 focus-visible:ring-2 focus-visible:ring-accent-600/25 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted";

export function Input({
  className,
  ...props
}: ComponentPropsWithoutRef<"input">) {
  return <input className={cn(CONTROL, className)} {...props} />;
}

export function Textarea({
  className,
  rows = 4,
  ...props
}: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      rows={rows}
      className={cn(CONTROL, "min-h-24 resize-y", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"select">) {
  return (
    <select className={cn(CONTROL, "pr-8", className)} {...props}>
      {children}
    </select>
  );
}
