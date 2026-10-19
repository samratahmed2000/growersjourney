import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/content/site";
import { projects } from "@/lib/content/projects";

/**
 * sitemap.xml
 *
 * `lastModified` is deliberately omitted: reading the clock at request time is
 * not allowed under Cache Components, and a fabricated date would be worse than
 * no date at all.
 */
const PUBLIC_ROUTES: Array<{ path: string; priority: number }> = [
  { path: "/", priority: 1 },
  { path: "/services", priority: 0.9 },
  { path: "/work", priority: 0.8 },
  { path: "/about", priority: 0.7 },
  { path: "/process", priority: 0.7 },
  { path: "/contact", priority: 0.8 },
  { path: "/privacy-policy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_ROUTES.map(
    ({ path, priority }) => ({
      url: new URL(path, base).toString(),
      changeFrequency: "monthly" as const,
      priority,
    }),
  );

  const projectEntries: MetadataRoute.Sitemap = projects.map((project) => ({
    url: new URL(`/work/${project.slug}`, base).toString(),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...projectEntries];
}
