import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  PortalAccessState,
  PortalEmptyState,
  PortalErrorState,
} from "@/components/portal/states";
import { Card } from "@/components/ui/card";
import { portalGet } from "@/lib/api/portal.server";
import { formatDate, formatDateTime } from "@/lib/admin/format";
import { milestoneTone, projectTone } from "@/lib/admin/status";
import type { MilestoneStatus } from "@/lib/admin/types";
import type {
  PortalMilestone,
  PortalProjectDetail,
  PortalProjectUpdate,
} from "@/lib/portal/types";

export const metadata: Metadata = {
  title: "Project details",
  robots: { index: false, follow: false },
};

export const instant = false;

const MILESTONE_ICONS = {
  PENDING: Circle,
  IN_PROGRESS: Clock3,
  COMPLETED: CheckCircle2,
  BLOCKED: AlertTriangle,
};

function milestoneIcon(status: MilestoneStatus) {
  return MILESTONE_ICONS[status];
}

export default async function PortalProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projectPath = `/portal/projects/${encodeURIComponent(id)}`;

  const [projectResult, milestoneResult, updateResult] = await Promise.all([
    portalGet<{ project: PortalProjectDetail }>(projectPath),
    portalGet<{ items: PortalMilestone[] }>(`${projectPath}/milestones`),
    portalGet<{ items: PortalProjectUpdate[] }>(`${projectPath}/updates?limit=20`),
  ]);

  for (const result of [projectResult, milestoneResult, updateResult]) {
    if (!result.ok && result.status === 401) {
      redirect(`/login?next=${encodeURIComponent(projectPath)}`);
    }
    if (!result.ok && result.status === 403) {
      return <PortalAccessState />;
    }
  }

  if (!projectResult.ok) {
    if (projectResult.status === 404 || projectResult.status === 400) notFound();
    return (
      <PortalErrorState
        message={projectResult.message}
        retryHref={projectPath}
      />
    );
  }

  if (!milestoneResult.ok) {
    if (milestoneResult.status === 404) notFound();
    return (
      <PortalErrorState
        message={milestoneResult.message}
        retryHref={projectPath}
      />
    );
  }

  if (!updateResult.ok) {
    if (updateResult.status === 404) notFound();
    return (
      <PortalErrorState
        message={updateResult.message}
        retryHref={projectPath}
      />
    );
  }

  const project = projectResult.data.project;
  const milestones = milestoneResult.data.items;
  const updates = updateResult.data.items;

  return (
    <div className="space-y-6">
      <Link
        href="/portal/projects"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to projects
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-600">
            Project
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {project.name}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {project.milestoneCounts.completed} of{" "}
            {project.milestoneCounts.total} milestones complete · updated{" "}
            {formatDate(project.updatedAt)}
          </p>
        </div>
        <StatusBadge status={project.status} tone={projectTone(project.status)} />
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-ink">About this project</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink">
              {project.description || "No project description has been added yet."}
            </p>
          </Card>

          <section aria-labelledby="milestones-heading">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="milestones-heading" className="text-lg font-semibold text-ink">
                  Milestones
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Delivery checkpoints and their current state.
                </p>
              </div>
              <p className="text-sm font-medium text-muted">
                {project.milestoneCounts.completed} of{" "}
                {project.milestoneCounts.total} complete
              </p>
            </div>

            {milestones.length === 0 ? (
              <PortalEmptyState
                title="No milestones yet"
                description="Milestones will appear here when the delivery plan is recorded."
              />
            ) : (
              <ol className="relative space-y-4 border-l border-line pl-6">
                {milestones.map((milestone) => {
                  const Icon = milestoneIcon(milestone.status);
                  return (
                    <li key={milestone.id} className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute -left-[2.15rem] top-1 flex size-5 items-center justify-center rounded-full border border-line bg-surface text-accent-600"
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <Card className="p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <h3 className="font-semibold text-ink">{milestone.title}</h3>
                          <StatusBadge
                            status={milestone.status}
                            tone={milestoneTone(milestone.status)}
                          />
                        </div>
                        {milestone.description ? (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                            {milestone.description}
                          </p>
                        ) : null}
                        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
                          <div className="flex gap-1.5">
                            <dt>Due</dt>
                            <dd className="font-medium text-ink">
                              {formatDate(milestone.dueDate)}
                            </dd>
                          </div>
                          {milestone.completedAt ? (
                            <div className="flex gap-1.5">
                              <dt>Completed</dt>
                              <dd className="font-medium text-ink">
                                {formatDate(milestone.completedAt)}
                              </dd>
                            </div>
                          ) : null}
                        </dl>
                      </Card>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section aria-labelledby="updates-heading">
            <h2 id="updates-heading" className="text-lg font-semibold text-ink">
              Progress updates
            </h2>
            <p className="mt-1 text-sm text-muted">
              Only updates published to the client portal are shown.
            </p>

            {updates.length === 0 ? (
              <div className="mt-3">
                <PortalEmptyState
                  title="No updates published yet"
                  description="Internal delivery notes stay private. Published client updates will appear here."
                />
              </div>
            ) : (
              <ol className="mt-3 space-y-3">
                {updates.map((update) => (
                  <li key={update.id}>
                    <Card className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="font-semibold text-ink">{update.title}</h3>
                        <p className="text-xs text-muted">
                          {formatDateTime(update.createdAt)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs font-medium text-accent-600">
                        {update.authorName}
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink">
                        {update.body}
                      </p>
                    </Card>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-6">
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
            <h2 className="text-base font-semibold text-ink">Links and documents</h2>
            {project.links.length === 0 ? (
              <p className="mt-2 text-sm leading-6 text-muted">
                No project links have been shared yet.
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
            <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
              Links open an external site. Growers Journy does not store files in
              the portal in this version.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function DateRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{formatDate(value)}</dd>
    </div>
  );
}
