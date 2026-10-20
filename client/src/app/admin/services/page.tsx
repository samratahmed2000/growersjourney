import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FilterBar, FilterActions } from "@/components/admin/filter-bar";
import { FilterField, Input, Select } from "@/components/admin/filter-controls";
import { DataTable } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminErrorState } from "@/components/admin/error-state";
import { PaginationBar } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { adminGet } from "@/lib/api/admin.server";
import { formatDate } from "@/lib/admin/format";
import {
  firstValue,
  parsePositiveInt,
  toQuery,
  type RawSearchParams,
} from "@/lib/admin/search-params";
import type { ListResult, Service } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Services",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: RawSearchParams;
}) {
  const raw = await searchParams;
  const page = parsePositiveInt(firstValue(raw.page), 1, 10_000);
  const search = firstValue(raw.search);
  const published = firstValue(raw.published);
  const includeArchived = firstValue(raw.includeArchived);

  const apiQuery = toQuery({
    page,
    limit: 20,
    search: search || undefined,
    published:
      published === "true" || published === "false" ? published : undefined,
    includeArchived:
      includeArchived === "true" || includeArchived === "false"
        ? includeArchived
        : undefined,
    sort: "updatedAt",
    order: "desc",
  });

  const result = await adminGet<ListResult<Service>["data"]>(
    `/admin/services${apiQuery}`,
  );

  if (!result.ok) {
    if (result.status === 401) redirect("/login?next=/admin/services");
    return <AdminErrorState message={result.message} retryHref="/admin/services" />;
  }

  const items = result.data.items;
  const hasFilters = Boolean(search || published || includeArchived);

  return (
    <>
      <AdminPageHeader
        eyebrow="Content"
        title="Services"
        description="Manage the service catalogue. Publication state is stored in the database; the public website keeps its static service copy until a separate migration is approved."
        actions={
          <ButtonLink href="/admin/services/new">
            <Plus aria-hidden="true" className="size-4" />
            Add service
          </ButtonLink>
        }
      />

      <FilterBar>
        <FilterField id="service-search" label="Search">
          <Input
            id="service-search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Title, slug, or summary"
            maxLength={100}
          />
        </FilterField>
        <FilterField id="service-published-filter" label="Publication">
          <Select
            id="service-published-filter"
            name="published"
            defaultValue={published ?? ""}
          >
            <option value="">Any publication state</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </Select>
        </FilterField>
        <FilterField id="service-archived-filter" label="Archive">
          <Select
            id="service-archived-filter"
            name="includeArchived"
            defaultValue={includeArchived ?? "false"}
          >
            <option value="false">Active records</option>
            <option value="true">Include archived</option>
          </Select>
        </FilterField>
        <FilterActions resetHref="/admin/services" />
      </FilterBar>

      {items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No matching services" : "No services yet"}
          description={
            hasFilters
              ? "Try a different search, publication state, or archive filter."
              : "Add a service record to begin managing the catalogue. No sample services are inserted."
          }
          action={
            hasFilters ? undefined : (
              <ButtonLink href="/admin/services/new">Add the first service</ButtonLink>
            )
          }
        />
      ) : (
        <>
          <DataTable
            caption="Service content records"
            columns={[
              { label: "Service" },
              { label: "Publication" },
              { label: "Order" },
              { label: "Updated" },
              { label: "Action" },
            ]}
            rows={items.map((service) => ({
              id: service.id,
              cells: [
                <div key="service">
                  <Link
                    href={`/admin/services/${service.id}`}
                    className="font-medium text-accent-600 hover:underline"
                  >
                    {service.title}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    /{service.slug}
                  </p>
                </div>,
                <div key="publication" className="flex flex-wrap gap-1.5">
                  {service.isArchived ? (
                    <StatusBadge status="Archived" tone="danger" />
                  ) : service.isPublished ? (
                    <StatusBadge status="Published" tone="accent" />
                  ) : (
                    <StatusBadge status="Draft" tone="neutral" />
                  )}
                </div>,
                <span key="order" className="tabular-nums text-muted">
                  {service.sortOrder}
                </span>,
                <span key="updated" className="text-muted">
                  {formatDate(service.updatedAt)}
                </span>,
                <Link
                  key="action"
                  href={`/admin/services/${service.id}`}
                  className="font-medium text-accent-600 hover:underline"
                >
                  Open
                </Link>,
              ],
            }))}
          />
          {result.pagination ? (
            <PaginationBar
              basePath="/admin/services"
              query={raw}
              pagination={result.pagination}
            />
          ) : null}
        </>
      )}
    </>
  );
}
