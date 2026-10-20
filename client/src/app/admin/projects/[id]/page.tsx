import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminErrorState } from "@/components/admin/error-state";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card } from "@/components/ui/card";
import { adminGet } from "@/lib/api/admin.server";
import { formatDate } from "@/lib/admin/format";
import { projectTone } from "@/lib/admin/status";
import type { ProjectDetail } from "@/lib/admin/types";

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
  const result = await adminGet<{ project: ProjectDetail }>(
    `/admin/projects/${encodeURIComponent(id)}`,
  );

  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/login?next=${encodeURIComponent(`/admin/projects/${id}`)}`);
    }
    if (result.status === 404 || result.status === 400) notFound();
    return (
      <AdminErrorState
        message={result.message}
        retryHref={`/admin/projects/${id}`}
      />
    );
  }

  const project = result.data.project;

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
        eyebrow="Project"
        title={project.name}
        description={`Last updated ${formatDate(project.updatedAt)}`}
        actions={
          <StatusBadge
            status={project.status}
            tone={projectTone(project.status)}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-semibold text-ink">Description</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink">
            {project.description || "No description has been recorded."}
          </p>
        </Card>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
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
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">
                The linked client record is not available.
              </p>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink">Dates</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <DateRow label="Start" value={project.startDate} />
              <DateRow label="Due" value={project.dueDate} />
              <DateRow label="Completed" value={project.completedAt} />
              <DateRow label="Created" value={project.createdAt} />
            </dl>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink">Editing</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Projects are read-only in Task 07. Status changes, milestones, and
              project editing are intentionally deferred.
            </p>
          </Card>
        </div>
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
