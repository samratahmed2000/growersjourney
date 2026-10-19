import { cn } from "@/lib/utils";

/**
 * Shared section heading. `as` keeps the document outline correct: the homepage
 * uses h2, while a standalone page can use h1 for the same visual treatment.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  as: Heading = "h2",
  align = "left",
  className,
  id,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  as?: "h1" | "h2";
  align?: "left" | "center";
  className?: string;
  id?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-600">
          {eyebrow}
        </p>
      ) : null}
      <Heading
        id={id}
        className="mt-3 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
      >
        {title}
      </Heading>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
