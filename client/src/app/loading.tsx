/**
 * Global loading UI.
 *
 * Next.js requires this route-level file to export a React component. An empty
 * file makes every route that uses streaming fail to render.
 */
export default function Loading() {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <p>Loading…</p>
    </div>
  );
}
