import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

/** Shared route-level loading state for the admin list pages. */
export function AdminTableLoading({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-64 max-w-full" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <div className="mt-6">
        <TableSkeleton />
      </div>
    </div>
  );
}
