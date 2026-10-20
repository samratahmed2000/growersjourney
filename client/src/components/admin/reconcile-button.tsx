"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminMutate } from "@/lib/api/admin";

export function ReconcileButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function reconcile() {
    setPending(true);
    setMessage(null);
    const result = await adminMutate<{ reconciled: boolean; status: string }>(
      `/payments/${paymentId}/reconcile`,
      "POST",
    );
    setPending(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    if (!result.data.reconciled) {
      setMessage(`No change. Provider state: ${result.data.status}.`);
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <Button
        type="button"
        variant="secondary"
        onClick={reconcile}
        disabled={pending}
        className="w-full"
      >
        <RefreshCw aria-hidden="true" className="size-4" />
        {pending ? "Checking provider…" : "Reconcile with provider"}
      </Button>
    </div>
  );
}
