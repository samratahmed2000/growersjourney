"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminMutate } from "@/lib/api/admin";
import type { InvoiceDetail } from "@/lib/admin/types";

export function InvoiceActions({ invoice }: { invoice: InvoiceDetail }) {
  const router = useRouter();
  const [pending, setPending] = useState<"issue" | "void" | null>(null);
  const [reason, setReason] = useState("");
  const [showVoid, setShowVoid] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canIssue = invoice.allowedActions.includes("issue");
  const canVoid = invoice.allowedActions.includes("void");

  async function issue() {
    setPending("issue");
    setMessage(null);
    const result = await adminMutate<{ invoice: InvoiceDetail }>(
      `/invoices/${invoice.id}/issue`,
      "POST",
    );
    setPending(null);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    router.refresh();
  }

  async function voidInvoice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("void");
    setMessage(null);
    const result = await adminMutate<{ invoice: InvoiceDetail }>(
      `/invoices/${invoice.id}/void`,
      "POST",
      { reason },
    );
    setPending(null);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setShowVoid(false);
    setReason("");
    router.refresh();
  }

  if (!canIssue && !canVoid) return null;

  return (
    <div className="space-y-3">
      {message ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {message}
        </p>
      ) : null}

      {canIssue ? (
        <Button onClick={issue} disabled={pending !== null} className="w-full">
          <CheckCircle2 aria-hidden="true" className="size-4" />
          {pending === "issue" ? "Issuing…" : "Issue invoice"}
        </Button>
      ) : null}

      {canVoid && !showVoid ? (
        <Button
          variant="secondary"
          onClick={() => setShowVoid(true)}
          disabled={pending !== null}
          className="w-full"
        >
          <Ban aria-hidden="true" className="size-4" />
          Void invoice
        </Button>
      ) : null}

      {canVoid && showVoid ? (
        <form onSubmit={voidInvoice} className="space-y-3 rounded-lg border border-line bg-canvas p-3">
          <label htmlFor="void-reason" className="block text-sm font-medium text-ink">
            Why is this invoice being voided?
          </label>
          <textarea
            id="void-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            minLength={3}
            maxLength={500}
            required
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              variant="secondary"
              disabled={pending !== null || reason.trim().length < 3}
            >
              {pending === "void" ? "Voiding…" : "Confirm void"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowVoid(false)}
              disabled={pending !== null}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {canVoid ? (
        <p className="text-xs leading-5 text-muted">
          An invoice with verified payments cannot be voided until those payments
          are refunded.
        </p>
      ) : null}
    </div>
  );
}
