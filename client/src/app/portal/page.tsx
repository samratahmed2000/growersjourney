import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  MessageSquareText,
} from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  PortalAccessState,
  PortalEmptyState,
  PortalErrorState,
} from "@/components/portal/states";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { portalGet } from "@/lib/api/portal.server";
import { formatDate, formatDateTime } from "@/lib/admin/format";
import { milestoneTone, projectTone } from "@/lib/admin/status";
import type { PortalDashboard } from "@/lib/portal/types";

export const metadata: Metadata = {
  title: "Portal dashboard",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function PortalDashboardPage() {
  const result = await portalGet<PortalDashboard>("/portal/dashboard");

  if (!result.ok) {
    if (result.status === 401) redirect("/login?next=/portal");
    if (result.status === 403) return <PortalAccessState />;
    return (
      <PortalErrorState
        message={result.message}
        retryHref="/portal"
      />
    );
  }

  const {
    client,
    stats,
    activeProjects,
    recentlyUpdatedProjects,
    upcomingMilestones,
    recentActivity,
  } = result.data;
  const firstName = client.displayName.split(" ")[0] || client.displayName;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-600">
          Client portal
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          A live view of your project delivery. Only updates marked client-visible
          appear here.
        </p>
      </header>

      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">
          Delivery overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Active projects"
            value={stats.activeProjects}
            hint="Planning or in progress"
            icon={<FolderKanban className="size-5" />}
          />
          <StatCard
            label="Upcoming milestones"
            value={stats.upcomingMilestones}
            hint="Not completed, with a due date"
            icon={<CalendarClock className="size-5" />}
          />
          <StatCard
            label="Completed milestones"
            value={stats.completedMilestones}
            hint="Across your projects"
            icon={<CheckCircle2 className="size-5" />}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section aria-labelledby="active-projects-heading" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="active-projects-heading"
                className="text-lg font-semibold text-ink"
              >
                Active projects
              </h2>
              <p className="mt-1 text-sm text-muted">
                Work currently in planning or in progress.
              </p>
            </div>
            <Link
              href="/portal/projects"
              className="text-sm font-semibold text-accent-600 hover:underline"
            >
              View all projects
            </Link>
          </div>

          {activeProjects.length === 0 ? (
            <PortalEmptyState
              title="No active projects"
              description="When a project is created for your account, it will appear here. Nothing is fabricated."
              action={<ButtonLink href="/portal/projects" variant="secondary">All projects</ButtonLink>}
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {activeProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/portal/projects/${project.id}`}
                    className="group block h-full rounded-xl border border-line bg-surface p-5 transition-colors hover:border-accent-600/40 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-ink group-hover:text-accent-600">
                        {project.name}
                      </h3>
                      <StatusBadge
                        status={project.status}
                        tone={projectTone(project.status)}
                      />
                    </div>
                    <dl className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Due</dt>
                        <dd className="text-right font-medium text-ink">
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
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section aria-labelledby="recently-updated-heading">
            <h2
              id="recently-updated-heading"
              className="mb-3 text-lg font-semibold text-ink"
            >
              Recently updated
            </h2>
            {recentlyUpdatedProjects.length === 0 ? (
              <Card className="p-5 text-sm text-muted">
                No project activity has been recorded yet.
              </Card>
            ) : (
              <Card className="divide-y divide-line">
                {recentlyUpdatedProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/portal/projects/${project.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 first:rounded-t-xl last:rounded-b-xl hover:bg-canvas"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {project.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        Updated {formatDate(project.updatedAt)}
                      </p>
                    </div>
                    <StatusBadge
                      status={project.status}
                      tone={projectTone(project.status)}
                    />
                  </Link>
                ))}
              </Card>
            )}
          </section>

          <section aria-labelledby="upcoming-heading">
            <h2 id="upcoming-heading" className="mb-3 text-lg font-semibold text-ink">
              Upcoming milestones
            </h2>
            {upcomingMilestones.length === 0 ? (
              <Card className="p-5 text-sm text-muted">
                No upcoming milestone dates are recorded.
              </Card>
            ) : (
              <Card className="divide-y divide-line">
                {upcomingMilestones.map((milestone) => (
                  <Link
                    key={milestone.id}
                    href={`/portal/projects/${milestone.projectId}`}
                    className="block px-4 py-3 first:rounded-t-xl last:rounded-b-xl hover:bg-canvas"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-ink">
                        {milestone.title}
                      </p>
                      <StatusBadge
                        status={milestone.status}
                        tone={milestoneTone(milestone.status)}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {milestone.projectName ?? "Project"} · due{" "}
                      {formatDate(milestone.dueDate)}
                    </p>
                  </Link>
                ))}
              </Card>
            )}
          </section>
        </div>
      </div>

      <section aria-labelledby="activity-heading">
        <div className="mb-3 flex items-center gap-2">
          <MessageSquareText aria-hidden="true" className="size-5 text-accent-600" />
          <h2 id="activity-heading" className="text-lg font-semibold text-ink">
            Recent project activity
          </h2>
        </div>
        {recentActivity.length === 0 ? (
          <PortalEmptyState
            title="No client-visible updates yet"
            description="Internal delivery notes stay private. Published client updates will appear here."
          />
        ) : (
          <ol className="space-y-3">
            {recentActivity.map((activity) => (
              <li
                key={activity.id}
                className="rounded-xl border border-line bg-surface p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-ink">{activity.title}</h3>
                  <p className="text-xs text-muted">
                    {formatDateTime(activity.createdAt)}
                  </p>
                </div>
                <p className="mt-1 text-xs font-medium text-accent-600">
                  {activity.projectName ?? "Project"} · {activity.authorName}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink">
                  {activity.body}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
