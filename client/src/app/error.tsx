"use client";

/**
 * Global error boundary.
 *
 * Next.js requires this file to be a Client Component, which is why it starts
 * with the "use client" directive. Without it the whole app fails to render.
 *
 * Security note: `error.message` is intentionally NOT rendered. Error messages
 * can contain internal details, so only a safe, generic message is shown.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Something went wrong</h1>
      <p>An unexpected error occurred while loading this page.</p>
      <button type="button" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
