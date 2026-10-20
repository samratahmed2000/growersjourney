export default function PortalInvoicesLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading your invoices</p>
      <div className="h-4 w-24 animate-pulse rounded bg-line" />
      <div className="h-10 w-56 max-w-full animate-pulse rounded bg-line" />
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl border border-line bg-surface"
          />
        ))}
      </div>
    </div>
  );
}
