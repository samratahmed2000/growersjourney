import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminErrorState } from "@/components/admin/error-state";
import { MilestoneManager } from "@/components/admin/milestone-manager";
import { ProjectForm } from "@/components/admin/project-form";
import { ProjectStatusControl } from "@/components/admin/project-status-control";
import { ProjectUpdateManager } from "@/components/admin/project-update-manager";
import { StatusBadge } from "@/components/admin/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { adminGet } from "@/lib/api/admin.server";
import { formatDate, formatDateTime } from "@/lib/admin/format";
import { projectTone } from "@/lib/admin/status";
import type {
  ClientSummary,
  Milestone,
  ProjectDetail,
  ProjectUpdate,
} from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Project details",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projectPath = `/admin/projects/${encodeURIComponent(id)}`;

  const [projectResult, milestoneResult, updateResult, clientResult] =
    await Promise.all([
      adminGet<{ project: ProjectDetail }>(`/admin/projects/${encodeURIComponent(id)}`),
      adminGet<{ items: Milestone[] }>(
        `/admin/projects/${encodeURIComponent(id)}/milestones`,
      ),
      adminGet<{ items: ProjectUpdate[] }>(
        `/admin/projects/${encodeURIComponent(id)}/updates?limit=50`,
      ),
      adminGet<{ items: ClientSummary[] }>(
        "/admin/clients?limit=100&sort=displayName&order=asc",
      ),
    ]);

  if (!projectResult.ok) {
    if (projectResult.status === 401) {
      redirect(`/login?next=${encodeURIComponent(projectPath)}`);
    }
    if (projectResult.status === 404 || projectResult.status === 400) notFound();
    return (
      <AdminErrorState message={projectResult.message} retryHref={projectPath} />
    );
  }

  for (const result of [milestoneResult, updateResult, clientResult]) {
    if (!result.ok && result.status === 401) {
      redirect(`/login?next=${encodeURIComponent(projectPath)}`);
    }
  }

  if (!milestoneResult.ok) {
    return (
      <AdminErrorState
        message={milestoneResult.message}
        retryHref={projectPath}
      />
    );
  }

  if (!updateResult.ok) {
    return (
      <AdminErrorState message={updateResult.message} retryHref={projectPath} />
    );
  }

  if (!clientResult.ok) {
    return (
      <AdminErrorState message={clientResult.message} retryHref={projectPath} />
    );
  }

  const project = projectResult.data.project;
  const milestones = milestoneResult.data.items;
  const updates = updateResult.data.items;
  const clients = clientResult.data.items;
  const clientOptions: ClientSummary[] =
    project.client?.id &&
    !clients.some((client) => client.id === project.client?.id) &&
    project.client.displayName
      ? [
          {
            id: project.client.id,
            displayName: project.client.displayName,
            companyName: project.client.companyName ?? null,
            primaryEmail: project.client.primaryEmail ?? "",
            phone: null,
            status:
              project.client.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
            createdAt: null,
            updatedAt: null,
          },
          ...clients,
        ]
      : clients;

  return (
    <>
      <Link
        href="/admin/projects"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to projects
      </Link>

      <AdminPageHeader
        eyebrow="Project workflow"
        title={project.name}
        description={`Last updated ${formatDateTime(project.updatedAt)}`}
        actions={
          <StatusBadge
            status={project.status}
            tone={projectTone(project.status)}
          />
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          <section aria-labelledby="project-details-heading">
            <h2
              id="project-details-heading"
              className="mb-3 text-lg font-semibold text-ink"
            >
              Project details
            </h2>
            <Card className="p-5 sm:p-6">
              <ProjectForm mode="edit" project={project} clients={clientOptions} />
            </Card>
          </section>

          <section aria-labelledby="milestones-heading">
            <div className="mb-3">
              <h2 id="milestones-heading" className="text-lg font-semibold text-ink">
                Milestones
              </h2>
              <p className="mt-1 text-sm text-muted">
                {project.milestoneCounts.completed} of{" "}
                {project.milestoneCounts.total} complete. Status changes are
                validated against the approved transition map.
              </p>
            </div>
            <MilestoneManager
              projectId={project.id}
              milestones={milestones}
              projectStartDate={project.startDate}
              projectDueDate={project.dueDate}
            />
          </section>

          <section aria-labelledby="updates-heading">
            <div className="mb-3">
              <h2 id="updates-heading" className="text-lg font-semibold text-ink">
                Progress updates
              </h2>
              <p className="mt-1 text-sm text-muted">
                Internal updates stay admin-only. Client-visible updates appear in
                the portal, filtered in the database query.
              </p>
            </div>
            <ProjectUpdateManager projectId={project.id} updates={updates} />
          </section>
        </div>

        <aside className="space-y-6">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Status workflow</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Current status:{" "}
              <span className="font-medium text-ink">
                {project.status
                  .toLowerCase()
                  .split("_")
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(" ")}
              </span>
            </p>
            <div className="mt-4">
              <ProjectStatusControl
                projectId={project.id}
                currentStatus={project.status}
                allowedNextStatuses={project.allowedNextStatuses}
              />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Client</h2>
            {project.client?.displayName ? (
              <div className="mt-3">
                <Link
                  href={`/admin/clients/${project.client.id}`}
                  className="font-medium text-accent-600 hover:underline"
                >
                  {project.client.displayName}
                </Link>
                {project.client.companyName ? (
                  <p className="mt-1 text-sm text-muted">
                    {project.client.companyName}
                  </p>
                ) : null}
                {project.client.primaryEmail ? (
                  <p className="mt-2 break-all text-sm text-muted">
                    {project.client.primaryEmail}
                  </p>
                ) : null}
                <ButtonLink
                  href={`/admin/clients/${project.client.id}`}
                  variant="secondary"
                  className="mt-4"
                >
                  Open client record
                </ButtonLink>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">
                The linked client record is not available.
              </p>
            )}
            <p className="mt-4 border-t border-line pt-3 text-xs leading-5 text-muted">
              Portal access is linked explicitly on the client record. A matching
              email alone never grants access.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Timeline</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <DateRow label="Start" value={project.startDate} />
              <DateRow label="Expected completion" value={project.dueDate} />
              <DateRow label="Completed" value={project.completedAt} />
              <DateRow label="Created" value={project.createdAt} />
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Shared links</h2>
            {project.links.length === 0 ? (
              <p className="mt-2 text-sm leading-6 text-muted">
                No external links are attached. Add them in project details above.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {project.links.map((link) => (
                  <li key={`${link.label}-${link.url}`}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-start gap-1.5 text-sm font-medium text-accent-600 hover:underline"
                    >
                      <ExternalLink
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0"
                      />
                      <span className="break-all">{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}

function DateRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right text-ink">{formatDate(value)}</dd>
    </div>
  );
}
