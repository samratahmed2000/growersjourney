import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/content/site";

/**
 * robots.txt
 *
 * The admin, portal, and internal dev pages are excluded: they are not built
 * yet and must never be indexed when they are.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/portal", "/dev"],
      },
    ],
    sitemap: new URL("/sitemap.xml", base).toString(),
    host: base.origin,
  };
}
