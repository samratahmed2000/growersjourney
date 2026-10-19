import { cn } from "@/lib/utils";

/**
 * Typographic wordmark — the temporary brand lockup.
 *
 * There is no approved logo file yet, so the brand is set in type: a "GJ"
 * monogram plus the name. This keeps the site honest and easy to update once a
 * real logo exists (replace the monogram tile only; the name stays as text).
 *
 * Never add an arrow to the logo.
 */
export function Wordmark({
  variant = "dark",
  showName = true,
  className,
}: {
  variant?: "dark" | "light";
  showName?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg text-[0.72rem] font-semibold tracking-tight",
          variant === "dark"
            ? "bg-brand-900 text-white"
            : "bg-white/10 text-white ring-1 ring-inset ring-white/20",
        )}
      >
        GJ
      </span>
      {showName ? (
        <span
          className={cn(
            "text-[0.95rem] font-semibold tracking-tight",
            variant === "dark" ? "text-ink" : "text-white",
          )}
        >
          Growers Journy
        </span>
      ) : null}
    </span>
  );
}
