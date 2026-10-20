import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminErrorState } from "@/components/admin/error-state";
import { InquiryStatusForm } from "@/components/admin/inquiry-status-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card } from "@/components/ui/card";
import { adminGet } from "@/lib/api/admin.server";
import { formatDateTime } from "@/lib/admin/format";
import { inquiryTone } from "@/lib/admin/status";
import type { InquiryDetail } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Inquiry details",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await adminGet<{ inquiry: InquiryDetail }>(
    `/admin/inquiries/${encodeURIComponent(id)}`,
  );

  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/login?next=${encodeURIComponent(`/admin/inquiries/${id}`)}`);
    }
    if (result.status === 404 || result.status === 400) notFound();
    return (
      <AdminErrorState
        message={result.message}
        retryHref={`/admin/inquiries/${id}`}
      />
    );
  }

  const inquiry = result.data.inquiry;

  return (
    <>
      <Link
        href="/admin/inquiries"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to inquiries
      </Link>

      <AdminPageHeader
        eyebrow="Inquiry"
        title={inquiry.name}
        description={`Received ${formatDateTime(inquiry.createdAt)}`}
        actions={
          <StatusBadge
            status={inquiry.status}
            tone={inquiryTone(inquiry.status)}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink">Contact details</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Detail label="Name">{inquiry.name}</Detail>
              <Detail label="Email">
                <a
                  href={`mailto:${inquiry.email}`}
                  className="break-all text-accent-600 hover:underline"
                >
                  {inquiry.email}
                </a>
              </Detail>
              <Detail label="Company">{inquiry.company ?? "—"}</Detail>
              <Detail label="Service">
                <span className="capitalize">
                  {inquiry.service.replace(/-/g, " ")}
                </span>
              </Detail>
              <Detail label="Budget">{inquiry.budget ?? "Not provided"}</Detail>
              <Detail label="Timeline">
                {inquiry.timeline ?? "Not provided"}
              </Detail>
            </dl>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink">Project brief</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink">
              {inquiry.projectDescription}
            </p>
            {inquiry.referenceUrl ? (
              <a
                href={inquiry.referenceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-4 inline-flex items-center gap-1.5 break-all text-sm font-medium text-accent-600 hover:underline"
              >
                Open reference link
                <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
              </a>
            ) : null}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink">Status</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Only valid next steps are offered. The API rejects any other
              transition with a conflict response.
            </p>
            <p className="mt-2 text-xs leading-5 text-muted">
              Marking an inquiry “Converted” is a label change only. It does not
              create a client or a project.
            </p>
            <div className="mt-4">
              <InquiryStatusForm
                key={inquiry.status}
                inquiryId={inquiry.id}
                currentStatus={inquiry.status}
                allowedStatuses={inquiry.allowedNextStatuses}
              />
            </div>
            {inquiry.statusChangedAt ? (
              <p className="mt-4 border-t border-line pt-4 text-xs text-muted">
                Last status change: {formatDateTime(inquiry.statusChangedAt)}
              </p>
            ) : null}
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink">Record</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Inquiry id
                </dt>
                <dd className="mt-1 break-all font-mono text-xs text-ink">
                  {inquiry.id}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Last updated
                </dt>
                <dd className="mt-1 text-ink">
                  {formatDateTime(inquiry.updatedAt)}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}

function Detail({
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
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  );
}
