import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DataTableColumn = {
  label: string;
  className?: string;
};

export type DataTableRow = {
  id: string;
  cells: ReactNode[];
};

/**
 * Semantic table on wide screens, definition-list cards on narrow screens.
 * Status is always rendered as text, never colour alone.
 */
export function DataTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: DataTableColumn[];
  rows: DataTableRow[];
}) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface md:block">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-line bg-canvas/70">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted",
                    column.className,
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.id} className="align-top hover:bg-canvas/50">
                {row.cells.map((cell, index) => (
                  <td key={index} className="px-4 py-4 text-ink">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-xl border border-line bg-surface p-4"
          >
            <dl className="space-y-3">
              {row.cells.map((cell, index) => (
                <div key={index}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {columns[index]?.label}
                  </dt>
                  <dd className="mt-1 text-sm text-ink">{cell}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
