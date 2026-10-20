import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FilterBar, FilterActions } from "@/components/admin/filter-bar";
import { FilterField, Input, Select } from "@/components/admin/filter-controls";
import { DataTable } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminErrorState } from "@/components/admin/error-state";
import { PaginationBar } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { adminGet } from "@/lib/api/admin.server";
import { formatDate } from "@/lib/admin/format";
import { projectTone } from "@/lib/admin/status";
import {
  firstValue,
  parsePositiveInt,
  toQuery,
  type RawSearchParams,
} from "@/lib/admin/search-params";
import type {
  ListResult,
  ProjectStatus,
  ProjectSummary,
} from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Projects",
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

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: RawSearchParams;
}) {
  const raw = await searchParams;
  const page = parsePositiveInt(firstValue(raw.page), 1, 10_000);
  const status = firstValue(raw.status);
  const search = firstValue(raw.search);

  const apiQuery = toQuery({
    page,
    limit: 20,
    status: STATUS_OPTIONS.includes(status as ProjectStatus)
      ? status
      : undefined,
    search: search || undefined,
    sort: "updatedAt",
    order: "desc",
  });

  const result = await adminGet<ListResult<ProjectSummary>["data"]>(
    `/admin/projects${apiQuery}`,
  );

  if (!result.ok) {
    if (result.status === 401) redirect("/login?next=/admin/projects");
    return <AdminErrorState message={result.message} retryHref="/admin/projects" />;
  }

  const items = result.data.items;
  const hasFilters = Boolean(status || search);

  return (
    <>
      <AdminPageHeader
        eyebrow="Delivery"
        title="Projects"
        description="Read-only project records for Task 07. Project creation, milestones, team assignment, and client portal access are not implemented."
      />

      <FilterBar>
        <FilterField id="project-search" label="Search">
          <Input
            id="project-search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Project name or description"
            maxLength={100}
          />
        </FilterField>
        <FilterField id="project-status" label="Status">
          <Select id="project-status" name="status" defaultValue={status ?? ""}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option
                  .toLowerCase()
                  .split("_")
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(" ")}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterActions resetHref="/admin/projects" />
      </FilterBar>

      {items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No matching projects" : "No projects yet"}
          description={
            hasFilters
              ? "Try a different search or remove the status filter."
              : "Project records will appear here once they exist in the database. Nothing has been fabricated."
          }
        />
      ) : (
        <>
          <DataTable
            caption="Project records"
            columns={[
              { label: "Project" },
              { label: "Client" },
              { label: "Status" },
              { label: "Start" },
              { label: "Due" },
              { label: "Action" },
            ]}
            rows={items.map((project) => ({
              id: project.id,
              cells: [
                <Link
                  key="project"
                  href={`/admin/projects/${project.id}`}
                  className="font-medium text-accent-600 hover:underline"
                >
                  {project.name}
                </Link>,
                project.client?.displayName ? (
                  <Link
                    key="client"
                    href={`/admin/clients/${project.client.id}`}
                    className="font-medium text-accent-600 hover:underline"
                  >
                    {project.client.displayName}
                    {project.client.companyName ? (
                      <span className="block text-xs font-normal text-muted">
                        {project.client.companyName}
                      </span>
                    ) : null}
                  </Link>
                ) : (
                  <span key="client" className="text-muted">
                    Unknown client
                  </span>
                ),
                <StatusBadge
                  key="status"
                  status={project.status}
                  tone={projectTone(project.status)}
                />,
                <span key="start" className="text-muted">
                  {formatDate(project.startDate)}
                </span>,
                <span key="due" className="text-muted">
                  {formatDate(project.dueDate)}
                </span>,
                <Link
                  key="action"
                  href={`/admin/projects/${project.id}`}
                  className="font-medium text-accent-600 hover:underline"
                >
                  View
                </Link>,
              ],
            }))}
          />
          {result.pagination ? (
            <PaginationBar
              basePath="/admin/projects"
              query={raw}
              pagination={result.pagination}
            />
          ) : null}
        </>
      )}
    </>
  );
}
