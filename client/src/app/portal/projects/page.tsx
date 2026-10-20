import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { PaginationBar } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  PortalAccessState,
  PortalEmptyState,
  PortalErrorState,
} from "@/components/portal/states";
import { Select } from "@/components/ui/field-controls";
import { portalGet } from "@/lib/api/portal.server";
import { formatDate } from "@/lib/admin/format";
import {
  firstValue,
  parsePositiveInt,
  toQuery,
  type RawSearchParams,
} from "@/lib/admin/search-params";
import { projectTone } from "@/lib/admin/status";
import type { ProjectStatus } from "@/lib/admin/types";
import type { PortalProjectSummary } from "@/lib/portal/types";

export const metadata: Metadata = {
  title: "Your projects",
  robots: { index: false, follow: false },
};

export const instant = false;

const STATUS_OPTIONS: ProjectStatus[] = [
  "PLANNING",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
];

function statusLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function PortalProjectsPage({
  searchParams,
}: {
  searchParams: RawSearchParams;
}) {
  const raw = await searchParams;
  const page = parsePositiveInt(firstValue(raw.page), 1, 10_000);
  const status = firstValue(raw.status);
  const selectedStatus = STATUS_OPTIONS.includes(status as ProjectStatus)
    ? (status as ProjectStatus)
    : undefined;

  const query = toQuery({
    page,
    limit: 12,
    status: selectedStatus,
  });

  const result = await portalGet<{ items: PortalProjectSummary[] }>(
    `/portal/projects${query}`,
  );

  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/login?next=${encodeURIComponent("/portal/projects")}`);
    }
    if (result.status === 403) return <PortalAccessState />;
    return (
      <PortalErrorState
        message={result.message}
        retryHref="/portal/projects"
      />
    );
  }

  const items = result.data.items;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-600">
            Delivery
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Your projects
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Every project shown here belongs to your client account. A project
            ID from another account returns not found.
          </p>
        </div>
        <FolderKanban aria-hidden="true" className="size-10 text-accent-600" />
      </header>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-4"
      >
        <div className="min-w-[200px]">
          <label htmlFor="project-status" className="block text-sm font-medium text-ink">
            Status
          </label>
          <Select
            id="project-status"
            name="status"
            defaultValue={selectedStatus ?? ""}
            className="mt-1.5"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {statusLabel(option)}
              </option>
            ))}
          </Select>
        </div>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-900 px-4 text-sm font-medium text-white hover:bg-brand-800"
        >
          Apply
        </button>
        <Link
          href="/portal/projects"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-canvas"
        >
          Reset
        </Link>
      </form>

      {items.length === 0 ? (
        <PortalEmptyState
          title={selectedStatus ? "No projects with this status" : "No projects yet"}
          description={
            selectedStatus
              ? "Try a different status, or reset the filter to see every project."
              : "Your client account has no project records yet. Nothing has been fabricated."
          }
        />
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/portal/projects/${project.id}`}
                  className="group flex h-full flex-col rounded-xl border border-line bg-surface p-5 transition-colors hover:border-accent-600/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold text-ink group-hover:text-accent-600">
                      {project.name}
                    </h2>
                    <StatusBadge
                      status={project.status}
                      tone={projectTone(project.status)}
                    />
                  </div>

                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Started</dt>
                      <dd className="text-right text-ink">
                        {formatDate(project.startDate)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Due</dt>
                      <dd className="text-right text-ink">
                        {formatDate(project.dueDate)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Milestones</dt>
                      <dd className="text-right font-medium text-ink">
                        {project.milestoneCounts.completed} of{" "}
                        {project.milestoneCounts.total} complete
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-auto pt-4 text-xs text-muted">
                    Updated {formatDate(project.updatedAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {result.pagination ? (
            <PaginationBar
              basePath="/portal/projects"
              query={raw}
              pagination={result.pagination}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
