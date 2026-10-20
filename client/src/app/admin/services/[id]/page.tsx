import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminErrorState } from "@/components/admin/error-state";
import { ArchiveButton } from "@/components/admin/archive-button";
import { RestoreButton } from "@/components/admin/restore-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { adminGet } from "@/lib/api/admin.server";
import { formatDate } from "@/lib/admin/format";
import type { Service } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Service details",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await adminGet<{ service: Service }>(
    `/admin/services/${encodeURIComponent(id)}`,
  );

  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/login?next=${encodeURIComponent(`/admin/services/${id}`)}`);
    }
    if (result.status === 404 || result.status === 400) notFound();
    return (
      <AdminErrorState
        message={result.message}
        retryHref={`/admin/services/${id}`}
      />
    );
  }

  const service = result.data.service;

  return (
    <>
      <Link
        href="/admin/services"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to services
      </Link>

      <AdminPageHeader
        eyebrow="Service"
        title={service.title}
        description={`Last updated ${formatDate(service.updatedAt)}`}
        actions={
          <>
            {service.isArchived ? (
              <StatusBadge status="Archived" tone="danger" />
            ) : service.isPublished ? (
              <StatusBadge status="Published" tone="accent" />
            ) : (
              <StatusBadge status="Draft" tone="neutral" />
            )}
            <ButtonLink href={`/admin/services/${service.id}/edit`} variant="secondary">
              Edit service
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink">Overview</h2>
            <dl className="mt-4 space-y-4">
              <Row label="Slug">
                <span className="font-mono text-xs">/{service.slug}</span>
              </Row>
              <Row label="Summary">{service.summary}</Row>
              <Row label="Icon">{service.icon}</Row>
              <Row label="Audience">{service.audience || "—"}</Row>
            </dl>
          </Card>

          {service.description ? (
            <Card className="p-5 sm:p-6">
              <h2 className="text-base font-semibold text-ink">Description</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink">
                {service.description}
              </p>
            </Card>
          ) : null}

          <div className="grid gap-6 sm:grid-cols-2">
            <ListCard title="Problems addressed" items={service.problems} />
            <ListCard title="Deliverables" items={service.deliverables} />
            <ListCard title="Capabilities" items={service.capabilities} />
            <ListCard title="Technologies" items={service.technologies} />
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink">Publication</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <Row label="Published">{service.isPublished ? "Yes" : "No"}</Row>
              <Row label="Archived">{service.isArchived ? "Yes" : "No"}</Row>
              <Row label="Sort order">{String(service.sortOrder)}</Row>
            </dl>
            <p className="mt-4 border-t border-line pt-3 text-xs leading-5 text-muted">
              The public website still reads its static service content. Editing
              this record changes admin data only until a public migration is
              approved.
            </p>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink">Archive</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Archiving unpublishes the record and hides it from active lists.
              Existing data is preserved; this is not a permanent delete.
            </p>
            <div className="mt-4">
              {service.isArchived ? (
                <RestoreButton
                  endpoint={`/services/${service.id}`}
                  recordName={service.title}
                  noun="service"
                />
              ) : (
                <ArchiveButton
                  endpoint={`/services/${service.id}`}
                  recordName={service.title}
                  noun="service"
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-6 text-ink">{children}</dd>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted">None recorded.</p>
      ) : (
        <ul className="mt-3 space-y-1.5 text-sm text-ink">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="text-accent-600">
                •
              </span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
