import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { Service } from "@/types/type";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function ServiceCard({
  service,
  className,
}: {
  service: Service;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border border-line bg-surface p-6 transition-colors hover:border-brand-900/25",
        className,
      )}
    >
      <span className="grid size-11 place-items-center rounded-xl bg-brand-900/5 text-brand-900">
        <Icon name={service.icon} className="size-5" />
      </span>

      <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink">
        {service.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {service.summary}
      </p>

      <ul className="mt-5 space-y-2">
        {service.capabilities.slice(0, 3).map((capability) => (
          <li
            key={capability}
            className="flex items-start gap-2 text-sm text-muted"
          >
            <Check
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-accent-600"
            />
            {capability}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <Link
          href={`/services#${service.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 transition-colors hover:text-brand-900"
        >
          Service details
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </div>
  );
}
