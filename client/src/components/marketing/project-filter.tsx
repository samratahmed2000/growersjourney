"use client";

import { useState } from "react";
import type { Project } from "@/types/type";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/marketing/project-card";

/**
 * Category filter for /work.
 *
 * Filtering happens in the browser rather than through a query parameter:
 * the portfolio is small, and keeping the route static means /work is served
 * from the prerendered HTML with no server round trip.
 *
 * Accessibility: the buttons form a real toggle group (aria-pressed), and the
 * result count is announced through a polite live region.
 */
export function ProjectFilter({
  projects,
  categories,
}: {
  projects: Project[];
  categories: string[];
}) {
  const [activeCategory, setActiveCategory] = useState("All");

  const visibleProjects =
    activeCategory === "All"
      ? projects
      : projects.filter((project) => project.category === activeCategory);

  return (
    <div>
      <div
        role="group"
        aria-label="Filter projects by category"
        className="flex flex-wrap gap-2"
      >
        {categories.map((category) => {
          const isActive = category === activeCategory;

          return (
            <button
              key={category}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-brand-900 bg-brand-900 text-white"
                  : "border-line bg-surface text-muted hover:border-brand-900/25 hover:text-ink",
              )}
            >
              {category}
            </button>
          );
        })}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {visibleProjects.length} project
        {visibleProjects.length === 1 ? "" : "s"} shown
      </p>

      {visibleProjects.length > 0 ? (
        <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {visibleProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-line bg-surface p-10 text-center">
          <p className="text-sm text-muted">
            No projects in this category yet.
          </p>
        </div>
      )}
    </div>
  );
}
