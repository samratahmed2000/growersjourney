import Link from "next/link";

/**
 * Global 404 page.
 *
 * Next.js requires this route-level file to export a React component. An empty
 * file breaks 404 handling for the whole application.
 *
 * This is a safe placeholder — real branding and layout come in a later phase.
 */
export default function NotFound() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link href="/">Back to homepage</Link>
    </main>
  );
}
