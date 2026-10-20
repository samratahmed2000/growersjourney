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
import { formatDate, formatMoney, formatStatus } from "@/lib/admin/format";
import { invoiceTone } from "@/lib/admin/status";
import {
  firstValue,
  parsePositiveInt,
  toQuery,
  type RawSearchParams,
} from "@/lib/admin/search-params";
import type {
  InvoiceStatus,
  InvoiceSummary,
  Pagination,
} from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Invoices",
  robots: { index: false, follow: false },
};

export const instant = false;

const STATUS_OPTIONS: InvoiceStatus[] = [
  "DRAFT",
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "VOID",
];

export default async function AdminInvoicesPage({
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
    status: STATUS_OPTIONS.includes(status as InvoiceStatus) ? status : undefined,
    search: search || undefined,
    sort: "createdAt",
    order: "desc",
  });

  const result = await adminGet<{ items: InvoiceSummary[] }>(
    `/admin/invoices${apiQuery}`,
  );

  if (!result.ok) {
    if (result.status === 401) redirect("/login?next=/admin/invoices");
    return <AdminErrorState message={result.message} retryHref="/admin/invoices" />;
  }

  const items = result.data.items;
  const pagination = result.pagination as Pagination | undefined;
  const hasFilters = Boolean(status || search);

  return (
    <>
      <AdminPageHeader
        eyebrow="Finance"
        title="Invoices"
        description="Draft, issue, and track invoices. Amounts and payment state are calculated and verified by the server."
        actions={
          <ButtonLink href="/admin/invoices/new">
            <Plus aria-hidden="true" className="size-4" />
            New invoice
          </ButtonLink>
        }
      />

      <FilterBar>
        <FilterField id="invoice-search" label="Search">
          <Input
            id="invoice-search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Invoice number or notes"
            maxLength={120}
          />
        </FilterField>
        <FilterField id="invoice-status" label="Status">
          <Select id="invoice-status" name="status" defaultValue={status ?? ""}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatStatus(option)}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterActions resetHref="/admin/invoices" />
      </FilterBar>

      {items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No matching invoices" : "No invoices yet"}
          description={
            hasFilters
              ? "Try a different search or status."
              : "Create a draft invoice for an active client. No sample invoices are inserted."
          }
          action={
            hasFilters ? undefined : (
              <ButtonLink href="/admin/invoices/new">Create the first invoice</ButtonLink>
            )
          }
        />
      ) : (
        <>
          <DataTable
            caption="Invoice records"
            columns={[
              { label: "Invoice" },
              { label: "Client" },
              { label: "Status" },
              { label: "Due" },
              { label: "Total" },
              { label: "Balance" },
              { label: "Action" },
            ]}
            rows={items.map((invoice) => ({
              id: invoice.id,
              cells: [
                <Link
                  key="invoice"
                  href={`/admin/invoices/${invoice.id}`}
                  className="font-medium text-accent-600 hover:underline"
                >
                  {invoice.invoiceNumber ?? "Draft"}
                </Link>,
                invoice.client ? (
                  <span key="client">
                    <Link
                      href={`/admin/clients/${invoice.client.id}`}
                      className="font-medium text-accent-600 hover:underline"
                    >
                      {invoice.client.displayName}
                    </Link>
                    {invoice.project?.name ? (
                      <span className="block text-xs text-muted">
                        {invoice.project.name}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span key="client" className="text-muted">Unknown client</span>
                ),
                <StatusBadge
                  key="status"
                  status={formatStatus(invoice.status)}
                  tone={invoiceTone(invoice.status)}
                />,
                <span key="due" className="text-muted">
                  {formatDate(invoice.dueDate)}
                </span>,
                <span key="total" className="tabular-nums">
                  {formatMoney(invoice.totalMinor, invoice.currency)}
                </span>,
                <span key="balance" className="font-medium tabular-nums">
                  {formatMoney(invoice.balanceDueMinor, invoice.currency)}
                </span>,
                <Link
                  key="action"
                  href={`/admin/invoices/${invoice.id}`}
                  className="font-medium text-accent-600 hover:underline"
                >
                  View
                </Link>,
              ],
            }))}
          />
          {pagination ? (
            <PaginationBar
              basePath="/admin/invoices"
              query={raw}
              pagination={pagination}
            />
          ) : null}
        </>
      )}
    </>
  );
}
