import type { IconName } from "@/types/type";
import { Icon } from "@/components/ui/icon";

const LAYERS: Array<{ label: string; detail: string; icon: IconName }> = [
  { label: "Web application", detail: "Interface and server", icon: "code" },
  { label: "Business automation", detail: "Workflows and jobs", icon: "workflow" },
  { label: "AI assistance", detail: "Triage and drafting", icon: "sparkles" },
];

/**
 * Decorative hero panel.
 *
 * There is no approved product screenshot, so this deliberately shows an
 * abstract diagram instead of a fake dashboard. It also carries no numbers:
 * inventing "99.9% uptime" style figures is not acceptable.
 *
 * The panel is aria-hidden because the same three service lines are already
 * listed as real text in the hero.
 */
export function HeroVisual() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto w-full max-w-md lg:max-w-none"
    >
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-white/55">
            How the pieces fit
          </p>
          <span className="rounded-full border border-white/15 px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-white/55">
            Illustration
          </span>
        </div>

        <ol className="relative mt-5 space-y-3">
          <span className="absolute bottom-6 left-6 top-6 w-px bg-white/10" />

          {LAYERS.map((layer, index) => (
            <li
              key={layer.label}
              className="relative flex items-center gap-3 rounded-xl border border-white/10 bg-brand-950/60 px-4 py-3"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/5 text-accent-500">
                <Icon name={layer.icon} className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-white/90">
                  {layer.label}
                </span>
                <span className="block truncate text-xs text-white/50">
                  {layer.detail}
                </span>
              </span>
              <span className="ml-auto text-[0.65rem] font-medium text-white/50">
                {String(index + 1).padStart(2, "0")}
              </span>
            </li>
          ))}
        </ol>

        <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-relaxed text-white/55">
          A diagram of the three service areas — not a product screenshot.
        </p>
      </div>
    </div>
  );
}
