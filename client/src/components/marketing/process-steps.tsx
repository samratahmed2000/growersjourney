import { Check } from "lucide-react";
import type { ProcessStep } from "@/types/type";
import { Icon } from "@/components/ui/icon";

/**
 * One component, two densities:
 * - compact: the three-column grid on the homepage;
 * - detailed: the full list on /process, including deliverables.
 */
export function ProcessSteps({
  steps,
  detailed = false,
}: {
  steps: ProcessStep[];
  detailed?: boolean;
}) {
  if (detailed) {
    return (
      <ol className="space-y-6">
        {steps.map((step) => (
          <li
            key={step.number}
            className="rounded-xl border border-line bg-surface p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-start gap-4 sm:gap-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-900/5 text-brand-900">
                <Icon name={step.icon} className="size-5" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold tracking-[0.2em] text-accent-600">
                  {step.number}
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-base font-medium text-ink/80">
                  {step.summary}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {step.details}
                </p>

                <div className="mt-6">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    What you get
                  </h4>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {step.deliverables.map((deliverable) => (
                      <li
                        key={deliverable}
                        className="flex items-start gap-2 text-sm text-muted"
                      >
                        <Check
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-accent-600"
                        />
                        {deliverable}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((step) => (
        <li
          key={step.number}
          className="rounded-xl border border-line bg-surface p-6"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-[0.2em] text-accent-600">
              {step.number}
            </span>
            <Icon name={step.icon} className="size-5 text-brand-900/70" />
          </div>
          <h3 className="mt-4 text-base font-semibold tracking-tight text-ink">
            {step.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {step.summary}
          </p>
        </li>
      ))}
    </ol>
  );
}
