import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ReceiptText } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  PortalAccessState,
  PortalEmptyState,
  PortalErrorState,
} from "@/components/portal/states";
import { PaginationBar } from "@/components/admin/pagination";
import { Card } from "@/components/ui/card";
import { portalGet } from "@/lib/api/portal.server";
import { formatDate, formatMoney } from "@/lib/admin/format";
import { invoiceTone } from "@/lib/admin/status";
import type {
  InvoiceSummary,
  Pagination,
} from "@/lib/admin/types";
import { parsePositiveInt, type RawSearchParams } from "@/lib/admin/search-params";

export const metadata: Metadata = {
  title: "Your invoices",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function PortalInvoicesPage({
  searchParams,
}: {
  searchParams: RawSearchParams;
}) {
  const raw = await searchParams;
  const page = parsePositiveInt(
    typeof raw.page === "string" ? raw.page : undefined,
    1,
    10_000,
  );
  const result = await portalGet<{ items: InvoiceSummary[] }>(
    `/portal/invoices?page=${page}&limit=20`,
  );

  if (!result.ok) {
    if (result.status === 401) redirect("/login?next=/portal/invoices");
    if (result.status === 403) return <PortalAccessState />;
    return (
      <PortalErrorState
        message={result.message}
        retryHref="/portal/invoices"
      />
    );
  }

  const invoices = result.data.items;
  const pagination = result.pagination as Pagination | undefined;
  const outstanding = invoices.reduce(
    (total, invoice) => total + invoice.balanceDueMinor,
    0,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-600">
            Finance
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Your invoices
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Issued invoices, verified payments, and outstanding balances. Payment
            state is confirmed by the server, never by a browser redirect.
          </p>
        </div>
        {invoices.length > 0 ? (
          <Card className="px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Outstanding on this page
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-ink">
              {formatMoney(outstanding, invoices[0]?.currency ?? "BDT")}
            </p>
          </Card>
        ) : null}
      </header>

      {invoices.length === 0 ? (
        <PortalEmptyState
          title="No invoices yet"
          description="When an invoice is issued for your account, it will appear here with its verified payment history."
        />
      ) : (
        <>
          <ul className="space-y-4">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Card className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <ReceiptText
                          aria-hidden="true"
                          className="size-4 text-accent-600"
                        />
                        <Link
                          href={`/portal/invoices/${invoice.id}`}
                          className="font-semibold text-ink hover:text-accent-600"
                        >
                          {invoice.invoiceNumber ?? "Invoice"}
                        </Link>
                        <StatusBadge
                          status={invoice.status}
                          tone={invoiceTone(invoice.status)}
                        />
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {invoice.project?.name
                          ? `${invoice.project.name} · `
                          : ""}
                        Due {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">
                        Balance due
                      </p>
                      <p className="mt-1 text-xl font-semibold tabular-nums text-ink">
                        {formatMoney(invoice.balanceDueMinor, invoice.currency)}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Total {formatMoney(invoice.totalMinor, invoice.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                    <p className="text-xs text-muted">
                      {invoice.amountPaidMinor > 0
                        ? `${formatMoney(invoice.amountPaidMinor, invoice.currency)} verified paid`
                        : "No verified payment yet"}
                      {invoice.amountRefundedMinor > 0
                        ? ` · ${formatMoney(invoice.amountRefundedMinor, invoice.currency)} refunded`
                        : ""}
                    </p>
                    <Link
                      href={`/portal/invoices/${invoice.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-600 hover:underline"
                    >
                      {invoice.canPay ? "View and pay" : "View invoice"}
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
          {pagination ? (
            <PaginationBar
              basePath="/portal/invoices"
              query={raw}
              pagination={pagination}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
