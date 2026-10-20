import type { NextConfig } from "next";

/**
 * Where the Express API listens.
 *
 * `API_BASE_URL` is server-only and already includes `/api/v1`. The auth
 * endpoints live at the API origin under `/api/auth`, so only the origin is
 * needed for the rewrite. This value is read when the Next config is evaluated
 * (build/start), never shipped to the browser.
 */
const API_BASE_URL = (process.env.API_BASE_URL ?? "http://localhost:5000/api/v1").replace(
  /\/+$/,
  "",
);

const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "http://localhost:5000";
  }
})();

/** Headers for areas that must never be cached or indexed. */
const PRIVATE_PAGE_HEADERS = [
  { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  /**
   * The browser talks to `/api/auth/*` on the Next.js origin. This rewrite
   * forwards those requests to the Express-hosted Better Auth handler.
   *
   * Why same-origin matters: the session cookie is then scoped to the site the
   * visitor is actually using. Express validates the same cookie when the Next
   * server calls `/api/v1/auth/me`. No cookie is shared across unrelated
   * domains, and no auth token is stored in browser storage.
   */
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${API_ORIGIN}/api/auth/:path*`,
      },
      {
        source: "/api/v1/admin/:path*",
        destination: `${API_BASE_URL}/admin/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      ...["/admin", "/admin/:path*", "/portal", "/portal/:path*", "/login"].map(
        (source) => ({ source, headers: PRIVATE_PAGE_HEADERS }),
      ),
      {
        source: "/api/auth/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/api/v1/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
