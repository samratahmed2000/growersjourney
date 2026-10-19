/**
 * Global loading UI.
 *
 * Next.js requires this route-level file to export a React component: an empty
 * file makes every streaming route fail to render. The spinner is hidden from
 * assistive technology while the text carries the status, and the global
 * reduced-motion rule stops the animation for visitors who ask for that.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] items-center justify-center bg-canvas"
    >
      <p className="flex items-center gap-3 text-sm text-muted">
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-line border-t-accent-600"
        />
        Loading...
      </p>
    </div>
  );
}
