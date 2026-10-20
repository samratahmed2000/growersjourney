"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { portalMutate } from "@/lib/api/portal";
import { formatMoney, majorToMinor, minorToMajor } from "@/lib/admin/format";
import type { PaymentSummary } from "@/lib/admin/types";

export function PayInvoiceButton({
  invoiceId,
  balanceMinor,
  currency,
}: {
  invoiceId: string;
  balanceMinor: number;
  currency: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(minorToMajor(balanceMinor));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const submittingRef = useRef(false);

  async function pay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    setMessage(null);
    const amountMinor = majorToMinor(amount);
    if (!Number.isInteger(amountMinor) || amountMinor < 1) {
      setMessage("Enter a valid payment amount.");
      return;
    }
    if (amountMinor > balanceMinor) {
      setMessage("The payment amount cannot exceed the balance due.");
      return;
    }

    submittingRef.current = true;
    setPending(true);
    try {
      const result = await portalMutate<{
        payment: PaymentSummary;
        checkoutUrl: string | null;
        alreadyPaid?: boolean;
      }>(`/invoices/${invoiceId}/payment-session`, "POST", {
        amountMinor,
        // A fresh key per deliberate submit. The server also reuses any active
        // attempt for this invoice, so a double-click or a lost response cannot
        // create a second chargeable checkout.
        idempotencyKey: globalThis.crypto.randomUUID(),
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      if (result.data.checkoutUrl) {
        window.location.assign(result.data.checkoutUrl);
        return;
      }

      if (result.data.alreadyPaid) {
        router.refresh();
        return;
      }

      setMessage("The payment session did not return a checkout link.");
    } finally {
      submittingRef.current = false;
      setPending(false);
    }
  }

  return (
    <form onSubmit={pay} className="space-y-3">
      {message ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {message}
        </p>
      ) : null}

      <label htmlFor="payment-amount" className="block text-sm font-medium text-ink">
        Amount to pay ({currency})
      </label>
      <input
        id="payment-amount"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        inputMode="decimal"
        className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
      />
      <p className="text-xs text-muted">
        Balance due: {formatMoney(balanceMinor, currency)}. Partial payments are
        allowed.
      </p>

      <Button type="submit" disabled={pending} className="w-full">
        <CreditCard aria-hidden="true" className="size-4" />
        {pending ? "Starting checkout…" : "Continue to payment"}
      </Button>
      <p className="text-xs leading-5 text-muted">
        You will be redirected to the configured payment provider. The invoice is
        not marked paid until a signed provider event is verified by the server.
      </p>
    </form>
  );
}
