import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/types/type";

/**
 * FAQ built on native <details>/<summary>.
 *
 * Native disclosure needs no JavaScript, is keyboard operable, and is announced
 * correctly by screen readers, so it stays a Server Component.
 */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-left text-base font-medium text-ink transition-colors hover:bg-canvas sm:px-6 [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown
              aria-hidden="true"
              className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
            />
          </summary>
          <p className="max-w-2xl px-5 pb-5 text-sm leading-relaxed text-muted sm:px-6">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
