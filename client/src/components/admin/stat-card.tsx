import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: number;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        {icon ? (
          <span className="rounded-lg bg-canvas p-2 text-accent-600" aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">
        {value.toLocaleString("en-GB")}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}
