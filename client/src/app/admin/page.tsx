import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  FolderKanban,
  Inbox,
  Layers,
  Users,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatCard } from "@/components/admin/stat-card";
import { DataTable } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminErrorState } from "@/components/admin/error-state";
import { StatusBadge } from "@/components/admin/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { adminGet } from "@/lib/api/admin.server";
import { formatDateTime } from "@/lib/admin/format";
import { inquiryTone } from "@/lib/admin/status";
import type { DashboardSummary } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Admin dashboard",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminDashboardPage() {
  const result = await adminGet<DashboardSummary>("/admin/dashboard");

  if (!result.ok) {
    if (result.status === 401) redirect("/login?next=/admin");
    return (
      <AdminErrorState
        message={result.message}
        retryHref="/admin"
      />
    );
  }

  const summary = result.data;

  return (
    <>
      <AdminPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Live counts from the Growers Journy database. No revenue, invoice, or unverified outcome metrics are shown."
        actions={
          <>
            <ButtonLink href="/admin/inquiries">Review inquiries</ButtonLink>
            <ButtonLink href="/admin/clients/new" variant="secondary">
              Add client
            </ButtonLink>
          </>
        }
      />

      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="sr-only">
          Summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total inquiries"
            value={summary.inquiries.total}
            hint={`${summary.inquiries.new} new · ${summary.inquiries.pending} in review`}
            icon={<Inbox className="size-4" />}
          />
          <StatCard
            label="New inquiries"
            value={summary.inquiries.new}
            hint="Waiting for a first review"
            icon={<Inbox className="size-4" />}
          />
          <StatCard
            label="Active projects"
            value={summary.projects.active}
            hint={`${summary.projects.total} projects in total`}
            icon={<FolderKanban className="size-4" />}
          />
          <StatCard
            label="Clients"
            value={summary.clients.total}
            hint={`${summary.clients.active} active`}
            icon={<Users className="size-4" />}
          />
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section aria-labelledby="recent-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="recent-heading" className="text-lg font-semibold text-ink">
              Recent inquiries
            </h2>
            <Link
              href="/admin/inquiries"
              className="inline-flex items-center gap-1 text-sm font-medium text-accent-600 hover:underline"
            >
              View all
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          {summary.recentInquiries.length === 0 ? (
            <EmptyState
              title="No inquiries yet"
              description="New contact-form submissions will appear here. Nothing has been fabricated to fill the dashboard."
            />
          ) : (
            <DataTable
              caption="Most recent contact-form inquiries"
              columns={[
                { label: "Person" },
                { label: "Service" },
                { label: "Status" },
                { label: "Received" },
              ]}
              rows={summary.recentInquiries.map((inquiry) => ({
                id: inquiry.id,
                cells: [
                  <div key="person">
                    <Link
                      href={`/admin/inquiries/${inquiry.id}`}
                      className="font-medium text-accent-600 hover:underline"
                    >
                      {inquiry.name}
                    </Link>
                    <p className="mt-0.5 break-all text-xs text-muted">
                      {inquiry.email}
                    </p>
                  </div>,
                  <span key="service" className="capitalize">
                    {inquiry.service.replace(/-/g, " ")}
                  </span>,
                  <StatusBadge
                    key="status"
                    status={inquiry.status}
                    tone={inquiryTone(inquiry.status)}
                  />,
                  <span key="date" className="text-muted">
                    {formatDateTime(inquiry.createdAt)}
                  </span>,
                ],
              }))}
            />
          )}
        </section>

        <section aria-labelledby="shortcuts-heading">
          <h2 id="shortcuts-heading" className="mb-3 text-lg font-semibold text-ink">
            Shortcuts
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Shortcut
              href="/admin/inquiries?status=NEW"
              icon={<Inbox className="size-4" />}
              label="New inquiries"
              description="See submissions waiting for a first review."
            />
            <Shortcut
              href="/admin/clients"
              icon={<Users className="size-4" />}
              label="Client records"
              description="Search clients and open linked projects."
            />
            <Shortcut
              href="/admin/services"
              icon={<Layers className="size-4" />}
              label="Service content"
              description="Manage the service catalogue and publication state."
            />
            <Shortcut
              href="/admin/portfolio"
              icon={<FolderKanban className="size-4" />}
              label="Portfolio content"
              description="Manage labelled concepts and approved case studies."
            />
          </div>
        </section>
      </div>
    </>
  );
}

function Shortcut({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent-600/40 hover:bg-canvas"
    >
      <span className="inline-flex size-9 items-center justify-center rounded-lg bg-canvas text-accent-600 group-hover:bg-surface">
        {icon}
      </span>
      <span className="mt-3 block text-sm font-semibold text-ink">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-muted">
        {description}
      </span>
    </Link>
  );
}
