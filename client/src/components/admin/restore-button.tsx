"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { adminMutate } from "@/lib/api/admin";

/** Restore an archived record without deleting or recreating it. */
export function RestoreButton({
  endpoint,
  recordName,
  noun = "record",
  onRestored,
}: {
  endpoint: string;
  recordName: string;
  noun?: string;
  onRestored?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function restore() {
    setPending(true);
    setError(null);

    const result = await adminMutate(endpoint, "PATCH", { isArchived: false });

    if (!result.ok) {
      if (result.status === 401) {
        router.push("/login?next=/admin");
        return;
      }
      setError(result.message);
      setPending(false);
      return;
    }

    setPending(false);
    setSuccess(`${recordName} was restored as a draft.`);
    onRestored?.();
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
      <Button onClick={() => void restore()} disabled={pending} aria-busy={pending}>
        {pending ? "Restoring…" : `Restore ${noun}`}
      </Button>
    </div>
  );
}
