import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminErrorState } from "@/components/admin/error-state";
import { ClientStatusButton } from "@/components/admin/client-status-button";
import { DataTable } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusBadge } from "@/components/admin/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { adminGet } from "@/lib/api/admin.server";
import { formatDate } from "@/lib/admin/format";
import { clientTone, projectTone } from "@/lib/admin/status";
import type { ClientDetail, ProjectSummary } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Client details",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await adminGet<{
    client: ClientDetail;
    projects: ProjectSummary[];
  }>(`/admin/clients/${encodeURIComponent(id)}`);

  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/login?next=${encodeURIComponent(`/admin/clients/${id}`)}`);
    }
    if (result.status === 404 || result.status === 400) notFound();
    return (
      <AdminErrorState
        message={result.message}
        retryHref={`/admin/clients/${id}`}
      />
    );
  }

  const { client, projects } = result.data;

  return (
    <>
      <Link
        href="/admin/clients"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to clients
      </Link>

      <AdminPageHeader
        eyebrow="Client"
        title={client.displayName}
        description={client.companyName ?? undefined}
        actions={
          <>
            <StatusBadge status={client.status} tone={clientTone(client.status)} />
            <ButtonLink href={`/admin/clients/${client.id}/edit`} variant="secondary">
              Edit client
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink">Contact</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Email
                </dt>
                <dd className="mt-1">
                  <a
                    href={`mailto:${client.primaryEmail}`}
                    className="inline-flex items-center gap-1.5 break-all text-sm text-accent-600 hover:underline"
                  >
                    <Mail aria-hidden="true" className="size-4 shrink-0" />
                    {client.primaryEmail}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Phone
                </dt>
                <dd className="mt-1 text-sm text-ink">
                  {client.phone ? (
                    <a
                      href={`tel:${client.phone}`}
                      className="inline-flex items-center gap-1.5 text-accent-600 hover:underline"
                    >
                      <Phone aria-hidden="true" className="size-4 shrink-0" />
                      {client.phone}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Created
                </dt>
                <dd className="mt-1 text-sm text-ink">
                  {formatDate(client.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Last updated
                </dt>
                <dd className="mt-1 text-sm text-ink">
                  {formatDate(client.updatedAt)}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink">Internal notes</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink">
              {client.notes || "No internal notes have been added."}
            </p>
            <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
              Admin-only. These notes are not part of the public site or the
              client portal.
            </p>
          </Card>

          <section aria-labelledby="client-projects-heading">
            <h2
              id="client-projects-heading"
              className="mb-3 text-lg font-semibold text-ink"
            >
              Linked projects
            </h2>
            {projects.length === 0 ? (
              <EmptyState
                title="No linked projects"
                description="Projects appear here when a project record references this client. Project creation is not part of Task 07."
              />
            ) : (
              <DataTable
                caption={`Projects linked to ${client.displayName}`}
                columns={[
                  { label: "Project" },
                  { label: "Status" },
                  { label: "Due" },
                  { label: "Action" },
                ]}
                rows={projects.map((project) => ({
                  id: project.id,
                  cells: [
                    <Link
                      key="project"
                      href={`/admin/projects/${project.id}`}
                      className="font-medium text-accent-600 hover:underline"
                    >
                      {project.name}
                    </Link>,
                    <StatusBadge
                      key="status"
                      status={project.status}
                      tone={projectTone(project.status)}
                    />,
                    <span key="due" className="text-muted">
                      {formatDate(project.dueDate)}
                    </span>,
                    <Link
                      key="action"
                      href={`/admin/projects/${project.id}`}
                      className="font-medium text-accent-600 hover:underline"
                    >
                      Open
                    </Link>,
                  ],
                }))}
              />
            )}
          </section>
        </div>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink">Access</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              A client record is separate from a login. This page cannot create,
              invite, or impersonate a portal account.
            </p>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink">Client status</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Deactivation preserves the record and project links. It does not
              delete anything.
            </p>
            <div className="mt-4">
              <ClientStatusButton
                clientId={client.id}
                clientName={client.displayName}
                status={client.status}
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
