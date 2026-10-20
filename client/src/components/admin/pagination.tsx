import Link from "next/link";
import type { Pagination } from "@/lib/admin/types";

type QueryValues = Record<string, string | string[] | undefined>;

function pageHref(basePath: string, query: QueryValues, page: number): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (key === "page" || key === "limit") continue;
    if (typeof value === "string" && value !== "") params.set(key, value);
  }

  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}

export function PaginationBar({
  basePath,
  query,
  pagination,
}: {
  basePath: string;
  query: QueryValues;
  pagination: Pagination;
}) {
  if (pagination.total === 0) return null;

  const previous = Math.max(1, pagination.page - 1);
  const next = Math.min(pagination.totalPages, pagination.page + 1);
  const atStart = pagination.page <= 1;
  const atEnd = pagination.page >= pagination.totalPages;

  return (
    <nav
      aria-label="Pagination"
      className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm"
    >
      <p className="text-muted">
        Page {pagination.page} of {Math.max(pagination.totalPages, 1)} ·{" "}
        {pagination.total.toLocaleString("en-GB")} records
      </p>
      <div className="flex gap-2">
        {atStart ? (
          <span className="rounded-lg border border-line px-3 py-2 text-muted">
            Previous
          </span>
        ) : (
          <Link
            href={pageHref(basePath, query, previous)}
            className="rounded-lg border border-line px-3 py-2 font-medium text-ink hover:bg-canvas"
          >
            Previous
          </Link>
        )}
        {atEnd ? (
          <span className="rounded-lg border border-line px-3 py-2 text-muted">
            Next
          </span>
        ) : (
          <Link
            href={pageHref(basePath, query, next)}
            className="rounded-lg border border-line px-3 py-2 font-medium text-ink hover:bg-canvas"
          >
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}
