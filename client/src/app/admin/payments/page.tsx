import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FilterBar, FilterActions } from "@/components/admin/filter-bar";
import { FilterField, Select } from "@/components/admin/filter-controls";
import { DataTable } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminErrorState } from "@/components/admin/error-state";
import { PaginationBar } from "@/components/admin/pagination";
import { PaymentStatusBadge } from "@/components/admin/payment-status-badge";
import { adminGet } from "@/lib/api/admin.server";
import { formatDateTime, formatMoney, formatStatus } from "@/lib/admin/format";
import {
  firstValue,
  parsePositiveInt,
  toQuery,
  type RawSearchParams,
} from "@/lib/admin/search-params";
import type {
  Pagination,
  PaymentStatus,
  PaymentSummary,
} from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Payments",
  robots: { index: false, follow: false },
};

export const instant = false;

const STATUS_OPTIONS: PaymentStatus[] = [
  "INITIATED",
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
];

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: RawSearchParams;
}) {
  const raw = await searchParams;
  const page = parsePositiveInt(firstValue(raw.page), 1, 10_000);
  const status = firstValue(raw.status);

  const apiQuery = toQuery({
    page,
    limit: 20,
    status: STATUS_OPTIONS.includes(status as PaymentStatus) ? status : undefined,
  });

  const result = await adminGet<{ items: PaymentSummary[] }>(
    `/admin/payments${apiQuery}`,
  );

  if (!result.ok) {
    if (result.status === 401) redirect("/login?next=/admin/payments");
    return <AdminErrorState message={result.message} retryHref="/admin/payments" />;
  }

  const items = result.data.items;
  const pagination = result.pagination as Pagination | undefined;
  const hasFilters = Boolean(status);

  return (
    <>
      <AdminPageHeader
        eyebrow="Finance"
        title="Payments"
        description="Verified payment attempts and refunds. Successful payments can only be recorded by a signed provider event, never by a browser redirect."
      />

      <FilterBar>
        <FilterField id="payment-status" label="Status">
          <Select id="payment-status" name="status" defaultValue={status ?? ""}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatStatus(option)}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterActions resetHref="/admin/payments" />
      </FilterBar>

      {items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No matching payments" : "No payments yet"}
          description={
            hasFilters
              ? "Try a different payment status."
              : "Payment attempts appear here when a client starts a checkout from an issued invoice."
          }
        />
      ) : (
        <>
          <DataTable
            caption="Payment attempts"
            columns={[
              { label: "Payment" },
              { label: "Invoice" },
              { label: "Status" },
              { label: "Amount" },
              { label: "Refunded" },
              { label: "Created" },
              { label: "Action" },
            ]}
            rows={items.map((payment) => ({
              id: payment.id,
              cells: [
                <span key="payment" className="font-mono text-xs text-muted">
                  {payment.id.slice(-10)}
                </span>,
                <Link
                  key="invoice"
                  href={`/admin/invoices/${payment.invoiceId}`}
                  className="font-medium text-accent-600 hover:underline"
                >
                  {payment.invoice?.invoiceNumber ?? "View invoice"}
                </Link>,
                <PaymentStatusBadge key="status" status={payment.status} />,
                <span key="amount" className="tabular-nums">
                  {formatMoney(payment.amountMinor, payment.currency)}
                </span>,
                <span key="refunded" className="tabular-nums">
                  {formatMoney(payment.refundedAmountMinor, payment.currency)}
                </span>,
                <span key="created" className="text-muted">
                  {formatDateTime(payment.createdAt)}
                </span>,
                <Link
                  key="action"
                  href={`/admin/payments/${payment.id}`}
                  className="font-medium text-accent-600 hover:underline"
                >
                  View
                </Link>,
              ],
            }))}
          />
          {pagination ? (
            <PaginationBar
              basePath="/admin/payments"
              query={raw}
              pagination={pagination}
            />
          ) : null}
        </>
      )}
    </>
  );
}
