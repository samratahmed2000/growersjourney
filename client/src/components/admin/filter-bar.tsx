import type { ReactNode } from "react";
import Link from "next/link";

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <form
      method="get"
      className="mb-5 grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]"
    >
      {children}
    </form>
  );
}

export function FilterActions({ resetHref }: { resetHref: string }) {
  return (
    <div className="flex items-end gap-2">
      <button
        type="submit"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-900 px-4 text-sm font-medium text-white hover:bg-brand-800"
      >
        Apply
      </button>
      <Link
        href={resetHref}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-canvas"
      >
        Reset
      </Link>
    </div>
  );
}
