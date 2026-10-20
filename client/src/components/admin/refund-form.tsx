"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/admin/form-field";
import { adminMutate } from "@/lib/api/admin";
import { majorToMinor, minorToMajor, formatMoney } from "@/lib/admin/format";
import type { PaymentDetail } from "@/lib/admin/types";

export function RefundForm({ payment }: { payment: PaymentDetail }) {
  const router = useRouter();
  const remainingMinor =
    payment.amountMinor - payment.refundedAmountMinor;
  const [amount, setAmount] = useState(minorToMajor(Math.max(remainingMinor, 0)));
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (remainingMinor <= 0) {
    return (
      <p className="text-sm leading-6 text-muted">
        This payment has been fully refunded.
      </p>
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const amountMinor = majorToMinor(amount);
    if (!Number.isInteger(amountMinor) || amountMinor < 1) {
      setMessage("Enter a valid refund amount.");
      return;
    }
    if (amountMinor > remainingMinor) {
      setMessage("The refund amount cannot exceed the refundable balance.");
      return;
    }

    setPending(true);
    const result = await adminMutate<{ refund: unknown; payment: PaymentDetail }>(
      `/payments/${payment.id}/refund`,
      "POST",
      { amountMinor, reason },
    );
    setPending(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setReason("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {message ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {message}
        </p>
      ) : null}

      <p className="text-sm text-muted">
        Refundable balance:{" "}
        <span className="font-medium text-ink">
          {formatMoney(remainingMinor, payment.currency)}
        </span>
      </p>

      <FormField
        id="refund-amount"
        label={`Refund amount (${payment.currency})`}
        required
      >
        <input
          id="refund-amount"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="decimal"
          className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
        />
      </FormField>

      <FormField id="refund-reason" label="Refund reason" required>
        <textarea
          id="refund-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          minLength={3}
          maxLength={500}
          required
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
        />
      </FormField>

      <Button type="submit" variant="secondary" disabled={pending} className="w-full">
        <RotateCcw aria-hidden="true" className="size-4" />
        {pending ? "Refunding…" : "Refund payment"}
      </Button>
      <p className="text-xs leading-5 text-muted">
        The refund is applied only after the configured provider confirms it.
        With the FAKE provider this is an immediate mock confirmation.
      </p>
    </form>
  );
}
