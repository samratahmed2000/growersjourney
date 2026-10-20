import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertTone = "info" | "success" | "warning" | "error";

const TONES: Record<AlertTone, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-900",
};

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: ShieldAlert,
  error: AlertCircle,
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const Icon = ICONS[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-xl border p-4 text-sm",
        TONES[tone],
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={title ? "mt-1" : ""}>{children}</div> : null}
      </div>
    </div>
  );
}
