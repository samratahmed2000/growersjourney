import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The single horizontal rhythm for the whole site.
 * Every section uses this, so page edges line up without repeating classes.
 */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1200px] px-5 sm:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
