"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { adminMutate } from "@/lib/api/admin";
import type { ClientStatus } from "@/lib/admin/types";

export function ClientStatusButton({
  clientId,
  clientName,
  status,
}: {
  clientId: string;
  clientName: string;
  status: ClientStatus;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function change(nextStatus: ClientStatus) {
    setPending(true);
    setError(null);

    const result = await adminMutate(`/clients/${clientId}`, "PATCH", {
      status: nextStatus,
    });

    if (!result.ok) {
      if (result.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/admin/clients/${clientId}`)}`);
        return;
      }
      setError(result.message);
      setPending(false);
      setOpen(false);
      return;
    }

    setPending(false);
    setOpen(false);
    setSuccess(
      nextStatus === "INACTIVE"
        ? `${clientName} was deactivated.`
        : `${clientName} was reactivated.`,
    );
    router.refresh();
  }

  return (
    <div>
      {error ? (
        <Alert tone="error" className="mb-3">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert tone="success" className="mb-3">
          {success}
        </Alert>
      ) : null}

      {status === "ACTIVE" ? (
        <Button
          variant="secondary"
          className="border-amber-200 text-amber-900 hover:border-amber-300 hover:bg-amber-50"
          onClick={() => setOpen(true)}
        >
          Deactivate client
        </Button>
      ) : (
        <Button variant="secondary" onClick={() => void change("ACTIVE")} disabled={pending}>
          {pending ? "Reactivating…" : "Reactivate client"}
        </Button>
      )}

      <ConfirmDialog
        open={open}
        title="Deactivate client?"
        description={`${clientName} will be marked inactive. Their record and project links are preserved, and the client can be reactivated later.`}
        confirmLabel="Deactivate"
        pending={pending}
        danger
        onConfirm={() => void change("INACTIVE")}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
