import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { PaymentStatusBadge } from "@/components/admin/payment-status-badge";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  PortalAccessState,
  PortalErrorState,
} from "@/components/portal/states";
import { PayInvoiceButton } from "@/components/portal/pay-invoice-button";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { Card } from "@/components/ui/card";
import { portalGet } from "@/lib/api/portal.server";
import { formatDateTime, formatMoney } from "@/lib/admin/format";
import { invoiceTone } from "@/lib/admin/status";
import type { InvoiceDetail, PaymentSummary } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Invoice details",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function PortalInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoicePath = `/portal/invoices/${encodeURIComponent(id)}`;
  const result = await portalGet<{
    invoice: InvoiceDetail;
    payments: PaymentSummary[];
  }>(invoicePath);

  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/login?next=${encodeURIComponent(invoicePath)}`);
    }
    if (result.status === 403) return <PortalAccessState />;
    if (result.status === 404 || result.status === 400) notFound();
    return (
      <PortalErrorState message={result.message} retryHref="/portal/invoices" />
    );
  }

  const { invoice, payments } = result.data;

  return (
    <div className="space-y-6">
      <Link
        href="/portal/invoices"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline print:hidden"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to invoices
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-600">
            Invoice
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {invoice.invoiceNumber ?? "Invoice"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {invoice.project?.name ? `${invoice.project.name} · ` : ""}
            Issued by Growers Journy
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={invoice.status} tone={invoiceTone(invoice.status)} />
          <Link
            href={`${invoicePath}/print`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-canvas"
          >
            <Printer aria-hidden="true" className="size-4" />
            Print
          </Link>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <InvoiceDocument invoice={invoice} audience="client" />
        </div>

        <aside className="space-y-6 print:hidden">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Payment</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {invoice.status === "PAID"
                ? "This invoice is fully paid. Thank you."
                : invoice.status === "VOID"
                  ? "This invoice is void and must not be paid."
                  : `Balance due ${formatMoney(
                      invoice.balanceDueMinor,
                      invoice.currency,
                    )}.`}
            </p>
            {invoice.canPay ? (
              <div className="mt-4">
                <PayInvoiceButton
                  invoiceId={invoice.id}
                  balanceMinor={invoice.balanceDueMinor}
                  currency={invoice.currency}
                />
              </div>
            ) : null}
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Payment history</h2>
            {payments.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                No payment attempts have been made for this invoice.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="rounded-lg border border-line bg-canvas p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <PaymentStatusBadge status={payment.status} />
                      <p className="font-semibold tabular-nums text-ink">
                        {formatMoney(payment.amountMinor, payment.currency)}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {payment.method ? `${payment.method} · ` : ""}
                      {formatDateTime(payment.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 border-t border-line pt-3 text-xs leading-5 text-muted">
              Only payments verified by the payment provider are counted. A
              redirect back to this page is not proof of payment.
            </p>
          </Card>

          {invoice.notes ? (
            <Card className="p-5">
              <h2 className="text-base font-semibold text-ink">Notes from us</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">
                {invoice.notes}
              </p>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
