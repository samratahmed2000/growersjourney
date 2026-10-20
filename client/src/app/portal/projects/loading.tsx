export default function PortalProjectsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading your projects</p>
      <div className="h-4 w-28 animate-pulse rounded bg-line" />
      <div className="h-10 w-64 max-w-full animate-pulse rounded bg-line" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-48 animate-pulse rounded-xl border border-line bg-surface"
          />
        ))}
      </div>
    </div>
  );
}
