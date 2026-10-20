import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminErrorState } from "@/components/admin/error-state";
import { PaymentStatusBadge } from "@/components/admin/payment-status-badge";
import { ReconcileButton } from "@/components/admin/reconcile-button";
import { RefundForm } from "@/components/admin/refund-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card } from "@/components/ui/card";
import { adminGet } from "@/lib/api/admin.server";
import { formatDateTime, formatMoney } from "@/lib/admin/format";
import type { PaymentDetail } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Payment details",
  robots: { index: false, follow: false },
};

export const instant = false;

const REFUND_STATUS_TONE = {
  REQUESTED: "warning",
  SUCCEEDED: "accent",
  FAILED: "danger",
} as const;

export default async function AdminPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paymentPath = `/admin/payments/${encodeURIComponent(id)}`;
  const result = await adminGet<{ payment: PaymentDetail }>(
    `/admin/payments/${encodeURIComponent(id)}`,
  );

  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/login?next=${encodeURIComponent(paymentPath)}`);
    }
    if (result.status === 404 || result.status === 400) notFound();
    return (
      <AdminErrorState message={result.message} retryHref="/admin/payments" />
    );
  }

  const payment = result.data.payment;
  const canRefund =
    payment.status === "SUCCEEDED" || payment.status === "PARTIALLY_REFUNDED";
  const canReconcile =
    payment.status === "INITIATED" || payment.status === "PENDING";

  return (
    <>
      <Link
        href="/admin/payments"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to payments
      </Link>

      <AdminPageHeader
        eyebrow="Finance"
        title={`Payment ${payment.id.slice(-10)}`}
        description={`Created ${formatDateTime(payment.createdAt)}`}
        actions={<PaymentStatusBadge status={payment.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-ink">Verified payment</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <DetailRow
                label="Amount"
                value={formatMoney(payment.amountMinor, payment.currency)}
                strong
              />
              <DetailRow
                label="Applied to invoice"
                value={formatMoney(payment.appliedAmountMinor, payment.currency)}
              />
              <DetailRow
                label="Refunded"
                value={formatMoney(payment.refundedAmountMinor, payment.currency)}
              />
              <DetailRow
                label="Overpaid"
                value={formatMoney(payment.overpaidMinor, payment.currency)}
              />
              <DetailRow label="Provider" value={payment.provider} />
              <DetailRow label="Environment" value={payment.environment} />
              <DetailRow label="Method" value={payment.method ?? "—"} />
              <DetailRow
                label="Verified"
                value={formatDateTime(payment.verifiedAt)}
              />
            </dl>

            <div className="mt-5 border-t border-line pt-4">
              <p className="flex items-center gap-2 text-sm text-muted">
                <ShieldCheck aria-hidden="true" className="size-4 text-accent-600" />
                No card data is stored. This record was created from a
                signature-verified provider event and checked against the invoice
                amount, currency, and payment reference.
              </p>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-ink">Invoice</h2>
            {payment.invoice ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/admin/invoices/${payment.invoiceId}`}
                    className="font-medium text-accent-600 hover:underline"
                  >
                    {payment.invoice.invoiceNumber ?? "Draft invoice"}
                  </Link>
                  <p className="mt-1 text-sm text-muted">
                    {formatMoney(
                      payment.invoice.totalMinor,
                      payment.invoice.currency,
                    )}{" "}
                    total ·{" "}
                    {formatMoney(
                      payment.invoice.balanceDueMinor,
                      payment.invoice.currency,
                    )}{" "}
                    balance
                  </p>
                </div>
                <StatusBadge
                  status={payment.invoice.status}
                  tone={
                    payment.invoice.status === "PAID"
                      ? "accent"
                      : payment.invoice.status === "OVERDUE"
                        ? "danger"
                        : "info"
                  }
                />
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">
                The invoice record is no longer available.
              </p>
            )}
            {payment.providerTransactionId ? (
              <p className="mt-4 break-all border-t border-line pt-3 font-mono text-xs text-muted">
                {payment.providerTransactionId}
              </p>
            ) : null}
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-ink">Refunds</h2>
            {!payment.refunds || payment.refunds.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                No refunds have been recorded for this payment.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <thead className="border-b border-line">
                    <tr>
                      <th scope="col" className="py-2 pr-3 font-semibold">Amount</th>
                      <th scope="col" className="py-2 pr-3 font-semibold">Status</th>
                      <th scope="col" className="py-2 pr-3 font-semibold">Reason</th>
                      <th scope="col" className="py-2 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {payment.refunds.map((refund) => (
                      <tr key={refund.id}>
                        <td className="py-3 pr-3 tabular-nums">
                          {formatMoney(refund.amountMinor, payment.currency)}
                        </td>
                        <td className="py-3 pr-3">
                          <StatusBadge
                            status={refund.status}
                            tone={
                              REFUND_STATUS_TONE[
                                refund.status as keyof typeof REFUND_STATUS_TONE
                              ] ?? "neutral"
                            }
                          />
                        </td>
                        <td className="py-3 pr-3 text-muted">
                          {refund.reason ?? "—"}
                        </td>
                        <td className="py-3 text-muted">
                          {formatDateTime(refund.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          {canRefund ? (
            <Card className="p-5">
              <h2 className="text-base font-semibold text-ink">Refund</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Refunds are provider-confirmed. A full refund returns the invoice
                to its unpaid status; it never creates a void automatically.
              </p>
              <div className="mt-4">
                <RefundForm payment={payment} />
              </div>
            </Card>
          ) : null}

          {canReconcile ? (
            <Card className="p-5">
              <h2 className="text-base font-semibold text-ink">Reconciliation</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Ask the provider for the current payment state. A webhook is the
                normal path; reconciliation is a manual fallback.
              </p>
              <div className="mt-4">
                <ReconcileButton paymentId={payment.id} />
              </div>
            </Card>
          ) : null}

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Status history</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <DetailRow label="Initiated" value={formatDateTime(payment.initiatedAt)} />
              <DetailRow label="Verified" value={formatDateTime(payment.verifiedAt)} />
              <DetailRow label="Failed" value={formatDateTime(payment.failedAt)} />
              <DetailRow label="Updated" value={formatDateTime(payment.updatedAt)} />
            </dl>
          </Card>
        </aside>
      </div>
    </>
  );
}

function DetailRow({
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
