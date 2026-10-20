import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-line/70", className)}
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-label="Loading records" role="status">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="grid grid-cols-[1.4fr_1fr_0.6fr] gap-4 rounded-xl border border-line bg-surface p-4"
        >
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
