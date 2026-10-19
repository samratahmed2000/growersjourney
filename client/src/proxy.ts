import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { projects } from "@/lib/content/projects";

/**
 * Proxy (the file convention formerly called middleware).
 *
 * Why this exists
 * ---------------
 * The project detail route calls `notFound()` when a slug does not resolve.
 * With Cache Components and Partial Prefetching, the response shell is streamed
 * before that check runs, so Next.js sends the 404 UI with an HTTP 200 status
 * and adds `<meta name="robots" content="noindex">`. Next's own documentation
 * describes that as a "soft 404" and points to Proxy as the way to return a
 * real 404 status:
 *
 *   "For a 404, you can check the slug in Proxy, then rewrite it to a
 *    not-found route or return a 404 response."
 *
 * The portfolio is a small, fixed set of slugs, so the check here is a Set
 * lookup with no I/O — Proxy code should stay fast and must not fetch content.
 *
 * Scope: only /work/* is matched, so no other route pays for this.
 */
const KNOWN_PROJECT_SLUGS = new Set(projects.map((project) => project.slug));

export function proxy(request: NextRequest) {
  const match = /^\/work\/([^/]+)\/?$/.exec(request.nextUrl.pathname);

  if (!match) {
    return NextResponse.next();
  }

  if (KNOWN_PROJECT_SLUGS.has(match[1])) {
    return NextResponse.next();
  }

  // Unknown project: render the 404 page instead, keeping the typed URL.
  return NextResponse.rewrite(new URL("/_not-found", request.url));
}

export const config = {
  matcher: ["/work/:slug*"],
};
