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
import { formatDateTime } from "@/lib/admin/format";
import { inquiryTone } from "@/lib/admin/status";
import { services } from "@/lib/content/services";
import {
  firstValue,
  parsePositiveInt,
  toQuery,
  type RawSearchParams,
} from "@/lib/admin/search-params";
import type { InquiryStatus, InquirySummary } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Inquiries",
  robots: { index: false, follow: false },
};

export const instant = false;

const STATUS_OPTIONS: InquiryStatus[] = [
  "NEW",
  "REVIEWING",
  "QUALIFIED",
  "CONVERTED",
  "CLOSED",
];

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: RawSearchParams;
}) {
  const raw = await searchParams;
  const page = parsePositiveInt(firstValue(raw.page), 1, 10_000);
  const status = firstValue(raw.status);
  const service = firstValue(raw.service);
  const search = firstValue(raw.search);

  const apiQuery = toQuery({
    page,
    limit: 20,
    status: STATUS_OPTIONS.includes(status as InquiryStatus) ? status : undefined,
    service: service || undefined,
    search: search || undefined,
    sort: "createdAt",
    order: "desc",
  });

  const result = await adminGet<{ items: InquirySummary[] }>(
    `/admin/inquiries${apiQuery}`,
  );

  if (!result.ok) {
    if (result.status === 401) redirect("/login?next=/admin/inquiries");
    return <AdminErrorState message={result.message} retryHref="/admin/inquiries" />;
  }

  const items = result.data.items;
  const hasFilters = Boolean(status || service || search);

  return (
    <>
      <AdminPageHeader
        eyebrow="Pipeline"
        title="Inquiries"
        description="Review contact-form submissions, inspect the full message, and move each inquiry through a validated status pipeline."
      />

      <FilterBar>
        <FilterField id="inquiry-search" label="Search">
          <Input
            id="inquiry-search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Name, email, or company"
            maxLength={100}
          />
        </FilterField>
        <FilterField id="inquiry-status" label="Status">
          <Select id="inquiry-status" name="status" defaultValue={status ?? ""}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0) + option.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField id="inquiry-service" label="Service">
          <Select id="inquiry-service" name="service" defaultValue={service ?? ""}>
            <option value="">All services</option>
            {services.map((entry) => (
              <option key={entry.slug} value={entry.slug}>
                {entry.title}
              </option>
            ))}
            <option value="not-sure">Not sure yet</option>
          </Select>
        </FilterField>
        <FilterActions resetHref="/admin/inquiries" />
      </FilterBar>

      {items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No matching inquiries" : "No inquiries yet"}
          description={
            hasFilters
              ? "Try removing a filter or searching for a different name, email, or company."
              : "New contact-form submissions will appear here with their real status and timestamps."
          }
        />
      ) : (
        <>
          <DataTable
            caption="Contact-form inquiries"
            columns={[
              { label: "Person" },
              { label: "Service" },
              { label: "Status" },
              { label: "Received" },
              { label: "Action" },
            ]}
            rows={items.map((inquiry) => ({
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
                  {inquiry.company ? (
                    <p className="text-xs text-muted">{inquiry.company}</p>
                  ) : null}
                </div>,
                <span key="service" className="capitalize">
                  {inquiry.service.replace(/-/g, " ")}
                </span>,
                <StatusBadge
                  key="status"
                  status={inquiry.status}
                  tone={inquiryTone(inquiry.status)}
                />,
                <span key="received" className="text-muted">
                  {formatDateTime(inquiry.createdAt)}
                </span>,
                <Link
                  key="action"
                  href={`/admin/inquiries/${inquiry.id}`}
                  className="font-medium text-accent-600 hover:underline"
                >
                  View details
                </Link>,
              ],
            }))}
          />
          {result.pagination ? (
            <PaginationBar
              basePath="/admin/inquiries"
              query={raw}
              pagination={result.pagination}
            />
          ) : null}
        </>
      )}
    </>
  );
}
