export function TechStrip({
  items,
  title = "Tools we build with",
}: {
  items: string[];
  title?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        {title}
      </h2>

      <ul className="mt-5 flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-lg border border-line bg-canvas px-3 py-1.5 text-sm font-medium text-ink"
          >
            {item}
          </li>
        ))}
      </ul>

      <p className="mt-5 text-xs leading-relaxed text-muted">
        These are the tools used in this site&apos;s own stack. Product names
        belong to their respective owners; listing them implies no partnership
        or endorsement.
      </p>
    </div>
  );
}
