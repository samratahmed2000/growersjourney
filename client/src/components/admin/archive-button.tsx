"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { adminMutate } from "@/lib/api/admin";

export function ArchiveButton({
  endpoint,
  recordName,
  noun = "record",
}: {
  endpoint: string;
  recordName: string;
  noun?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleArchive() {
    setPending(true);
    setError(null);

    const result = await adminMutate(endpoint, "DELETE");

    if (!result.ok) {
      if (result.status === 401) {
        router.push("/login?next=/admin");
        return;
      }
      setError(result.message);
      setPending(false);
      setOpen(false);
      return;
    }

    setPending(false);
    setOpen(false);
    setSuccess(`${recordName} was archived.`);
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

      <Button
        variant="secondary"
        className="border-red-200 text-red-800 hover:border-red-300 hover:bg-red-50"
        onClick={() => setOpen(true)}
      >
        Archive {noun}
      </Button>

      <ConfirmDialog
        open={open}
        title={`Archive ${noun}?`}
        description={`“${recordName}” will be unpublished and hidden from active lists. Existing records are preserved, so this is not a permanent delete.`}
        confirmLabel={`Archive ${noun}`}
        pending={pending}
        danger
        onConfirm={() => void handleArchive()}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
