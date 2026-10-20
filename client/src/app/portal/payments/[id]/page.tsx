import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ReceiptText,
  RotateCcw,
} from "lucide-react";
import {
  PortalAccessState,
  PortalErrorState,
} from "@/components/portal/states";
import { PaymentStatusBadge } from "@/components/admin/payment-status-badge";
import { Card } from "@/components/ui/card";
import { portalGet } from "@/lib/api/portal.server";
import { formatDateTime, formatMoney } from "@/lib/admin/format";
import type { PaymentSummary } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Payment status",
  robots: { index: false, follow: false },
};

export const instant = false;

function ResultIcon({ status }: { status: PaymentSummary["status"] }) {
  if (status === "SUCCEEDED") {
    return <CheckCircle2 aria-hidden="true" className="size-9 text-accent-600" />;
  }
  if (status === "PENDING" || status === "INITIATED") {
    return <Clock3 aria-hidden="true" className="size-9 text-amber-700" />;
  }
  if (status === "REFUNDED" || status === "PARTIALLY_REFUNDED") {
    return <RotateCcw aria-hidden="true" className="size-9 text-accent-600" />;
  }
  return <AlertTriangle aria-hidden="true" className="size-9 text-red-700" />;
}

function resultCopy(status: PaymentSummary["status"]) {
  switch (status) {
    case "SUCCEEDED":
      return {
        title: "Payment verified",
        body: "The provider confirmed this payment and the server has applied it to your invoice.",
      };
    case "PENDING":
    case "INITIATED":
      return {
        title: "Payment is processing",
        body: "The provider has not confirmed this payment yet. This page does not treat the redirect as proof of payment; refresh after the provider finishes.",
      };
    case "REFUNDED":
      return {
        title: "Payment refunded",
        body: "This payment has been fully refunded.",
      };
    case "PARTIALLY_REFUNDED":
      return {
        title: "Payment partially refunded",
        body: "Part of this payment has been refunded. The invoice balance reflects only verified refunds.",
      };
    case "CANCELLED":
      return {
        title: "Payment cancelled",
        body: "No money was taken for this attempt.",
      };
    case "EXPIRED":
      return {
        title: "Payment session expired",
        body: "No money was taken for this attempt. Start a new payment from the invoice.",
      };
    default:
      return {
        title: "Payment did not complete",
        body: "The provider did not confirm this payment. You can try again from the invoice.",
      };
  }
}

export default async function PortalPaymentResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mock?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const paymentPath = `/portal/payments/${encodeURIComponent(id)}`;
  const result = await portalGet<{ payment: PaymentSummary }>(paymentPath);

  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/login?next=${encodeURIComponent(paymentPath)}`);
    }
    if (result.status === 403) return <PortalAccessState />;
    return (
      <PortalErrorState
        message={result.message}
        retryHref="/portal/invoices"
      />
    );
  }

  const payment = result.data.payment;
  const copy = resultCopy(payment.status);
  const invoiceHref = `/portal/invoices/${payment.invoiceId}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {query.mock === "1" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Test mode: this result came from the local FAKE payment provider. No real
          money moved.
        </p>
      ) : null}

      <Card className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <ResultIcon status={payment.status} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-ink">
                {copy.title}
              </h1>
              <PaymentStatusBadge status={payment.status} />
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">{copy.body}</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 border-t border-line pt-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Amount</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-ink">
              {formatMoney(payment.amountMinor, payment.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Refunded</dt>
            <dd className="mt-1 font-medium tabular-nums text-ink">
              {formatMoney(payment.refundedAmountMinor, payment.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Provider</dt>
            <dd className="mt-1 font-medium text-ink">
              {payment.provider} ({payment.environment})
            </dd>
          </div>
          <div>
            <dt className="text-muted">Last updated</dt>
            <dd className="mt-1 font-medium text-ink">
              {formatDateTime(payment.updatedAt)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={invoiceHref}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            <ReceiptText aria-hidden="true" className="size-4" />
            View invoice
          </Link>
          <Link
            href={paymentPath}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-canvas"
          >
            Refresh status
          </Link>
          {["FAILED", "CANCELLED", "EXPIRED"].includes(payment.status) ? (
            <Link
              href={invoiceHref}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-canvas"
            >
              Try again
            </Link>
          ) : null}
        </div>
      </Card>

      <p className="text-center text-xs leading-5 text-muted">
        A browser redirect is not proof of payment. Only a signature-verified
        provider event updates the invoice.
      </p>
    </div>
  );
}
