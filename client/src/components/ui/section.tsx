import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

/**
 * Standard vertical section with consistent spacing and a Container inside.
 *
 * `tone` switches the background, never the text colour alone: the "dark" tone
 * also flips the text to white, so a section can never end up with dark text on
 * a dark background.
 */
export function Section({
  children,
  className,
  id,
  labelledBy,
  tone = "canvas",
  spacing = "md",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  labelledBy?: string;
  tone?: "canvas" | "surface" | "dark";
  spacing?: "md" | "sm";
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        tone === "surface" && "bg-surface",
        tone === "dark" && "bg-brand-950 text-white",
        className,
      )}
    >
      <Container
        className={cn(spacing === "md" ? "py-16 sm:py-20 lg:py-24" : "py-10 sm:py-12")}
      >
        {children}
      </Container>
    </section>
  );
}
