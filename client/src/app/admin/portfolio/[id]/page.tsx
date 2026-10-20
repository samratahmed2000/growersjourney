import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminErrorState } from "@/components/admin/error-state";
import { ArchiveButton } from "@/components/admin/archive-button";
import { RestoreButton } from "@/components/admin/restore-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { adminGet } from "@/lib/api/admin.server";
import { formatDate } from "@/lib/admin/format";
import { portfolioTone } from "@/lib/admin/status";
import type { PortfolioEntry } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Portfolio details",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminPortfolioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await adminGet<{ portfolio: PortfolioEntry }>(
    `/admin/portfolio/${encodeURIComponent(id)}`,
  );

  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/login?next=${encodeURIComponent(`/admin/portfolio/${id}`)}`);
    }
    if (result.status === 404 || result.status === 400) notFound();
    return (
      <AdminErrorState
        message={result.message}
        retryHref={`/admin/portfolio/${id}`}
      />
    );
  }

  const entry = result.data.portfolio;

  return (
    <>
      <Link
        href="/admin/portfolio"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to portfolio
      </Link>

      <AdminPageHeader
        eyebrow="Portfolio entry"
        title={entry.title}
        description={`Last updated ${formatDate(entry.updatedAt)}`}
        actions={
          <>
            <StatusBadge
              status={entry.status}
              tone={portfolioTone(entry.status)}
            />
            {entry.isArchived ? (
              <StatusBadge status="Archived" tone="danger" />
            ) : entry.isPublished ? (
              <StatusBadge status="Published" tone="accent" />
            ) : (
              <StatusBadge status="Draft" tone="neutral" />
            )}
            <ButtonLink href={`/admin/portfolio/${entry.id}/edit`} variant="secondary">
              Edit entry
            </ButtonLink>
          </>
        }
      />

      {entry.isSample ? (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This entry is labelled as sample or concept work. Do not present it as
          delivered client work without written approval and verified details.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink">Overview</h2>
            <dl className="mt-4 space-y-4">
              <Row label="Slug">
                <span className="font-mono text-xs">/{entry.slug}</span>
              </Row>
              <Row label="Summary">{entry.summary}</Row>
              <Row label="Category">{entry.category || "—"}</Row>
              <Row label="Description">
                {entry.description || "No description has been recorded."}
              </Row>
            </dl>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <ListCard title="Technologies" items={entry.technologies} />
            <ListCard title="Features" items={entry.features} />
          </div>

          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink">Links</h2>
            <div className="mt-3 space-y-3">
              <LinkRow label="Live demo" href={entry.liveUrl} />
              <LinkRow label="Source" href={entry.sourceUrl} />
              <LinkRow label="Thumbnail" href={entry.thumbnailUrl} />
            </div>
            {entry.imageUrls.length > 0 ? (
              <div className="mt-4 border-t border-line pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Images
                </h3>
                <ul className="mt-2 space-y-2">
                  {entry.imageUrls.map((url) => (
                    <li key={url}>
                      <ExternalUrl href={url} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink">Publication</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <Row label="Published">{entry.isPublished ? "Yes" : "No"}</Row>
              <Row label="Featured">{entry.isFeatured ? "Yes" : "No"}</Row>
              <Row label="Sample">{entry.isSample ? "Yes" : "No"}</Row>
              <Row label="Archived">{entry.isArchived ? "Yes" : "No"}</Row>
              <Row label="Published at">{formatDate(entry.publishedAt)}</Row>
            </dl>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink">Archive</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Archiving unpublishes the entry and removes it from featured
              placement. The record is preserved.
            </p>
            <div className="mt-4">
              {entry.isArchived ? (
                <RestoreButton
                  endpoint={`/portfolio/${entry.id}`}
                  recordName={entry.title}
                  noun="entry"
                />
              ) : (
                <ArchiveButton
                  endpoint={`/portfolio/${entry.id}`}
                  recordName={entry.title}
                  noun="entry"
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

function LinkRow({ label, href }: { label: string; href: string | null }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      {href ? <ExternalUrl href={href} /> : <span className="text-muted">—</span>}
    </div>
  );
}

function ExternalUrl({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1 break-all font-medium text-accent-600 hover:underline"
    >
      {href}
      <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
    </a>
  );
}
