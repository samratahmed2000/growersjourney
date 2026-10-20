import type { ReactNode } from "react";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
