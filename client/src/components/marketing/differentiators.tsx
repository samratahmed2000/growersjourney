import type { Differentiator } from "@/types/type";
import { Icon } from "@/components/ui/icon";

export function Differentiators({ items }: { items: Differentiator[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li
          key={item.title}
          className="rounded-xl border border-line bg-surface p-6"
        >
          <span className="grid size-10 place-items-center rounded-lg bg-accent-500/10 text-accent-600">
            <Icon name={item.icon} className="size-5" />
          </span>
          <h3 className="mt-4 text-base font-semibold tracking-tight text-ink">
            {item.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {item.description}
          </p>
        </li>
      ))}
    </ul>
  );
}
