import { formatStatus } from "@/lib/admin/format";
import type { StatusTone } from "@/lib/admin/status";
import { cn } from "@/lib/utils";

const TONES: Record<StatusTone, string> = {
  neutral: "border-line bg-canvas text-muted",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  accent: "border-emerald-200 bg-emerald-50 text-emerald-800",
  brand: "border-brand-900 bg-brand-900 text-white",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-red-200 bg-red-50 text-red-800",
};

export function StatusBadge({
  status,
  tone = "neutral",
}: {
  status: string;
  tone?: StatusTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
      )}
    >
      {formatStatus(status)}
    </span>
  );
}
