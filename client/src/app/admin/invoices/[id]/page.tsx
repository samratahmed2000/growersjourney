import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, Pencil, Printer } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminErrorState } from "@/components/admin/error-state";
import { InvoiceActions } from "@/components/admin/invoice-actions";
import { PaymentStatusBadge } from "@/components/admin/payment-status-badge";
import { StatusBadge } from "@/components/admin/status-badge";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { adminGet } from "@/lib/api/admin.server";
import { formatDate, formatDateTime, formatMoney } from "@/lib/admin/format";
import { invoiceTone } from "@/lib/admin/status";
import type {
  InvoiceDetail,
  PaymentSummary,
} from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Invoice details",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoicePath = `/admin/invoices/${encodeURIComponent(id)}`;

  const [invoiceResult, paymentResult] = await Promise.all([
    adminGet<{ invoice: InvoiceDetail }>(
      `/admin/invoices/${encodeURIComponent(id)}`,
    ),
    adminGet<{ items: PaymentSummary[] }>(
      `/admin/payments?invoiceId=${encodeURIComponent(id)}&limit=100`,
    ),
  ]);

  if (!invoiceResult.ok) {
    if (invoiceResult.status === 401) {
      redirect(`/login?next=${encodeURIComponent(invoicePath)}`);
    }
    if (invoiceResult.status === 404 || invoiceResult.status === 400) notFound();
    return (
      <AdminErrorState message={invoiceResult.message} retryHref={invoicePath} />
    );
  }

  if (!paymentResult.ok) {
    if (paymentResult.status === 401) {
      redirect(`/login?next=${encodeURIComponent(invoicePath)}`);
    }
    return (
      <AdminErrorState message={paymentResult.message} retryHref={invoicePath} />
    );
  }

  const invoice = invoiceResult.data.invoice;
  const payments = paymentResult.data.items;
  const isDraft = invoice.status === "DRAFT";

  return (
    <>
      <Link
        href="/admin/invoices"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline print:hidden"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to invoices
      </Link>

      <div className="print:hidden">
        <AdminPageHeader
          eyebrow="Finance"
          title={invoice.invoiceNumber ?? "Draft invoice"}
          description={`Last updated ${formatDateTime(invoice.updatedAt)}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status={invoice.status}
                tone={invoiceTone(invoice.status)}
              />
              {isDraft ? (
                <ButtonLink
                  href={`${invoicePath}/edit`}
                  variant="secondary"
                >
                  <Pencil aria-hidden="true" className="size-4" />
                  Edit draft
                </ButtonLink>
              ) : null}
              <ButtonLink href={`${invoicePath}/print`} variant="secondary">
                <Printer aria-hidden="true" className="size-4" />
                Print
              </ButtonLink>
            </div>
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <InvoiceDocument invoice={invoice} audience="admin" />
        </div>

        <aside className="space-y-6 print:hidden">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Invoice actions</h2>
            {invoice.allowedActions.length === 0 ? (
              <p className="mt-2 text-sm leading-6 text-muted">
                This invoice is {invoice.status.toLowerCase().replaceAll("_", " ")}.
                No draft or void action is currently available. Payment state is
                changed only by verified provider events.
              </p>
            ) : (
              <div className="mt-4">
                <InvoiceActions invoice={invoice} />
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Summary</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <SummaryRow
                label="Total"
                value={formatMoney(invoice.totalMinor, invoice.currency)}
              />
              <SummaryRow
                label="Verified paid"
                value={formatMoney(invoice.amountPaidMinor, invoice.currency)}
              />
              <SummaryRow
                label="Refunded"
                value={formatMoney(invoice.amountRefundedMinor, invoice.currency)}
              />
              <SummaryRow
                label="Balance due"
                value={formatMoney(invoice.balanceDueMinor, invoice.currency)}
                strong
              />
              <SummaryRow
                label="Due date"
                value={formatDate(invoice.dueDate)}
              />
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Client</h2>
            {invoice.client ? (
              <div className="mt-3">
                <Link
                  href={`/admin/clients/${invoice.client.id}`}
                  className="inline-flex items-center gap-1.5 font-medium text-accent-600 hover:underline"
                >
                  {invoice.client.displayName ?? "Client"}
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </Link>
                {invoice.client.companyName ? (
                  <p className="mt-1 text-sm text-muted">
                    {invoice.client.companyName}
                  </p>
                ) : null}
                {invoice.client.primaryEmail ? (
                  <p className="mt-2 break-all text-sm text-muted">
                    {invoice.client.primaryEmail}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">Client record unavailable.</p>
            )}
            {invoice.project ? (
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Project
                </p>
                <Link
                  href={`/admin/projects/${invoice.project.id}`}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
                >
                  {invoice.project.name ?? "Project"}
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </Link>
              </div>
            ) : null}
          </Card>

          {invoice.voidReason ? (
            <Card className="border-red-200 bg-red-50 p-5">
              <h2 className="text-base font-semibold text-red-900">Void reason</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-red-800">
                {invoice.voidReason}
              </p>
              <p className="mt-3 text-xs text-red-700">
                Voided {formatDateTime(invoice.voidedAt)}
              </p>
            </Card>
          ) : null}
        </aside>
      </div>

      <section className="mt-8 print:hidden" aria-labelledby="payments-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="payments-heading" className="text-lg font-semibold text-ink">
              Payment attempts
            </h2>
            <p className="mt-1 text-sm text-muted">
              Only a signature-verified provider event can mark a payment
              successful. A browser redirect is never proof of payment.
            </p>
          </div>
          <p className="text-sm text-muted">{payments.length} recorded</p>
        </div>

        {payments.length === 0 ? (
          <Card className="p-5 text-sm text-muted">
            No payment attempts have been created for this invoice.
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
              <caption className="sr-only">Payment attempts for this invoice</caption>
              <thead className="bg-canvas">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Payment</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Refunded</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Created</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {payment.id.slice(-8)}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(payment.amountMinor, payment.currency)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(payment.refundedAmountMinor, payment.currency)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDateTime(payment.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/payments/${payment.id}`}
                        className="font-medium text-accent-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={strong ? "font-semibold text-ink" : "text-ink"}>{value}</dd>
    </div>
  );
}
