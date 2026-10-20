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
import { clientTone } from "@/lib/admin/status";
import {
  firstValue,
  parsePositiveInt,
  toQuery,
  type RawSearchParams,
} from "@/lib/admin/search-params";
import type { ClientSummary, ListResult } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Clients",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: RawSearchParams;
}) {
  const raw = await searchParams;
  const page = parsePositiveInt(firstValue(raw.page), 1, 10_000);
  const status = firstValue(raw.status);
  const search = firstValue(raw.search);

  const apiQuery = toQuery({
    page,
    limit: 20,
    status: status === "ACTIVE" || status === "INACTIVE" ? status : undefined,
    search: search || undefined,
    sort: "createdAt",
    order: "desc",
  });

  const result = await adminGet<ListResult<ClientSummary>["data"]>(
    `/admin/clients${apiQuery}`,
  );

  if (!result.ok) {
    if (result.status === 401) redirect("/login?next=/admin/clients");
    return <AdminErrorState message={result.message} retryHref="/admin/clients" />;
  }

  const items = result.data.items;
  const hasFilters = Boolean(status || search);

  return (
    <>
      <AdminPageHeader
        eyebrow="Relationships"
        title="Clients"
        description="Business records for current and past clients. Creating a client record does not create a portal login."
        actions={
          <ButtonLink href="/admin/clients/new">
            <Plus aria-hidden="true" className="size-4" />
            Add client
          </ButtonLink>
        }
      />

      <FilterBar>
        <FilterField id="client-search" label="Search">
          <Input
            id="client-search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Name, company, or email"
            maxLength={100}
          />
        </FilterField>
        <FilterField id="client-status" label="Status">
          <Select id="client-status" name="status" defaultValue={status ?? ""}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </FilterField>
        <FilterActions resetHref="/admin/clients" />
      </FilterBar>

      {items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No matching clients" : "No clients yet"}
          description={
            hasFilters
              ? "Try a different search or remove the status filter."
              : "Create a client record when a real business relationship starts. No sample clients are inserted."
          }
          action={
            hasFilters ? undefined : (
              <ButtonLink href="/admin/clients/new">Add the first client</ButtonLink>
            )
          }
        />
      ) : (
        <>
          <DataTable
            caption="Client records"
            columns={[
              { label: "Client" },
              { label: "Company" },
              { label: "Contact" },
              { label: "Status" },
              { label: "Updated" },
              { label: "Action" },
            ]}
            rows={items.map((client) => ({
              id: client.id,
              cells: [
                <Link
                  key="client"
                  href={`/admin/clients/${client.id}`}
                  className="font-medium text-accent-600 hover:underline"
                >
                  {client.displayName}
                </Link>,
                client.companyName ?? "—",
                <div key="contact" className="space-y-0.5">
                  <p className="break-all text-sm">{client.primaryEmail}</p>
                  {client.phone ? (
                    <p className="text-xs text-muted">{client.phone}</p>
                  ) : null}
                </div>,
                <StatusBadge
                  key="status"
                  status={client.status}
                  tone={clientTone(client.status)}
                />,
                <span key="updated" className="text-muted">
                  {formatDate(client.updatedAt)}
                </span>,
                <Link
                  key="action"
                  href={`/admin/clients/${client.id}`}
                  className="font-medium text-accent-600 hover:underline"
                >
                  Open
                </Link>,
              ],
            }))}
          />
          {result.pagination ? (
            <PaginationBar
              basePath="/admin/clients"
              query={raw}
              pagination={result.pagination}
            />
          ) : null}
        </>
      )}
    </>
  );
}
