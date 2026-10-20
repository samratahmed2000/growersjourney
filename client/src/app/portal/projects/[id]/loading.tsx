export default function PortalProjectDetailLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading project details</p>
      <div className="h-4 w-32 animate-pulse rounded bg-line" />
      <div className="h-10 w-80 max-w-full animate-pulse rounded bg-line" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-xl border border-line bg-surface" />
          <div className="h-64 animate-pulse rounded-xl border border-line bg-surface" />
        </div>
        <div className="h-56 animate-pulse rounded-xl border border-line bg-surface" />
      </div>
    </div>
  );
}
