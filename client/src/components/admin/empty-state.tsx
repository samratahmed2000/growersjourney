import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <Inbox aria-hidden="true" className="mx-auto size-8 text-muted" />
      <h2 className="mt-3 text-base font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">
        {description}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
