import { Badge } from "@/components/ui/badge";
import { formatDate, formatMoney, formatStatus } from "@/lib/admin/format";
import type { InvoiceDetail } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

/**
 * Printable invoice document shared by the admin and portal print pages.
 *
 * It only renders server-provided values. It never calculates a total or
 * accepts a payment state from the browser.
 */
export function InvoiceDocument({
  invoice,
  audience = "client",
}: {
  invoice: InvoiceDetail;
  audience?: "admin" | "client";
}) {
  return (
    <article className="mx-auto max-w-4xl rounded-xl border border-line bg-white p-6 text-ink shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none sm:p-10">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6">
        <div>
          <p className="text-xl font-bold tracking-tight text-brand-950">
            Growers Journy
          </p>
          <p className="mt-1 text-sm text-muted">Build Smarter. Grow Faster.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tracking-tight">
            {invoice.invoiceNumber ?? "Draft invoice"}
          </p>
          <div className="mt-2 flex justify-end">
            <Badge variant={invoice.status === "PAID" ? "accent" : "neutral"}>
              {formatStatus(invoice.status)}
            </Badge>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Bill to
          </p>
          <p className="mt-1 font-medium">
            {invoice.client?.displayName ?? "Client"}
          </p>
          {invoice.client?.companyName ? (
            <p className="text-sm text-muted">{invoice.client.companyName}</p>
          ) : null}
          {invoice.client?.primaryEmail ? (
            <p className="mt-1 break-all text-sm text-muted">
              {invoice.client.primaryEmail}
            </p>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Invoice dates
          </p>
          <p className="mt-1 text-sm">Issued: {formatDate(invoice.issueDate)}</p>
          <p className="text-sm">Due: {formatDate(invoice.dueDate)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Project
          </p>
          <p className="mt-1 text-sm">{invoice.project?.name ?? "Not linked"}</p>
          <p className="mt-1 text-sm text-muted">{invoice.currency}</p>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
          <caption className="sr-only">Invoice line items</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-3 font-semibold">
                Description
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-semibold">
                Qty
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-semibold">
                Unit price
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {invoice.lineItems.map((item, index) => (
              <tr key={`${item.description}-${index}`}>
                <td className="py-3 pr-3 align-top">{item.description}</td>
                <td className="py-3 pr-3 text-right align-top tabular-nums">
                  {item.quantity}
                </td>
                <td className="py-3 pr-3 text-right align-top tabular-nums">
                  {formatMoney(item.unitAmountMinor, invoice.currency)}
                </td>
                <td className="py-3 text-right align-top font-medium tabular-nums">
                  {formatMoney(item.lineTotalMinor, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <dl className="w-full max-w-sm space-y-2 text-sm">
          <TotalRow label="Subtotal" value={formatMoney(invoice.subtotalMinor, invoice.currency)} />
          {invoice.discountMinor > 0 ? (
            <TotalRow
              label="Discount"
              value={`-${formatMoney(invoice.discountMinor, invoice.currency)}`}
            />
          ) : null}
          {invoice.taxMinor > 0 ? (
            <TotalRow
              label={`Tax (${(invoice.taxRateBps / 100).toFixed(2)}%)`}
              value={formatMoney(invoice.taxMinor, invoice.currency)}
            />
          ) : null}
          <div className="border-t border-line pt-2">
            <TotalRow
              label="Total"
              value={formatMoney(invoice.totalMinor, invoice.currency)}
              strong
            />
          </div>
          <TotalRow
            label="Verified paid"
            value={formatMoney(invoice.amountPaidMinor, invoice.currency)}
          />
          {invoice.amountRefundedMinor > 0 ? (
            <TotalRow
              label="Refunded"
              value={`-${formatMoney(invoice.amountRefundedMinor, invoice.currency)}`}
            />
          ) : null}
          <div className="border-t border-line pt-2">
            <TotalRow
              label="Balance due"
              value={formatMoney(invoice.balanceDueMinor, invoice.currency)}
              strong
            />
          </div>
        </dl>
      </div>

      {invoice.notes ? (
        <section className="mt-8 border-t border-line pt-5" aria-labelledby="invoice-notes">
          <h2 id="invoice-notes" className="text-sm font-semibold">
            Notes
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">
            {invoice.notes}
          </p>
        </section>
      ) : null}

      {audience === "admin" && invoice.internalNotes ? (
        <section className="mt-6 rounded-lg bg-canvas p-4" aria-labelledby="invoice-internal-notes">
          <h2 id="invoice-internal-notes" className="text-sm font-semibold">
            Internal notes
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">
            {invoice.internalNotes}
          </p>
        </section>
      ) : null}

      {invoice.status === "VOID" ? (
        <p className="mt-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          This invoice is void. Do not pay it.
        </p>
      ) : null}

      <footer className="mt-10 border-t border-line pt-4 text-xs leading-5 text-muted">
        Payments shown here are verified by the server. A browser redirect or
        screenshot is not proof of payment.
      </footer>
    </article>
  );
}

function TotalRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={cn(strong ? "font-semibold text-ink" : "text-muted")}>
        {label}
      </dt>
      <dd className={cn("text-right tabular-nums", strong ? "font-semibold" : "")}>
        {value}
      </dd>
    </div>
  );
}
