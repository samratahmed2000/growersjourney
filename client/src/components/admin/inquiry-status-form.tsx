"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field-controls";
import { Alert } from "@/components/ui/alert";
import { formatStatus } from "@/lib/admin/format";
import type { InquiryStatus } from "@/lib/admin/types";
import { adminMutate } from "@/lib/api/admin";

export function InquiryStatusForm({
  inquiryId,
  currentStatus,
  allowedStatuses,
}: {
  inquiryId: string;
  currentStatus: InquiryStatus;
  allowedStatuses: InquiryStatus[];
}) {
  const router = useRouter();
  const selectId = useId();
  const [status, setStatus] = useState<InquiryStatus | "">(
    allowedStatuses[0] ?? "",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!status || pending) return;

    setPending(true);
    setError(null);
    setSuccess(null);
    setFieldError(undefined);

    const result = await adminMutate(`/inquiries/${inquiryId}`, "PATCH", {
      status,
    });

    if (!result.ok) {
      if (result.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/admin/inquiries/${inquiryId}`)}`);
        return;
      }
      setError(result.message);
      setFieldError(result.fieldErrors.status);
      setPending(false);
      return;
    }

    setSuccess(`Status changed to ${formatStatus(status)}.`);
    setPending(false);
    router.refresh();
  }

  if (allowedStatuses.length === 0) {
    return (
      <Alert tone="info" title="No further status changes">
        This inquiry is closed and is preserved for the record.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error ? <Alert tone="error">{error}</Alert> : null}
      {success ? <Alert tone="success">{success}</Alert> : null}

      <div>
        <label htmlFor={selectId} className="block text-sm font-medium text-ink">
          Move to
        </label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <Select
            id={selectId}
            value={status}
            onChange={(event) => setStatus(event.target.value as InquiryStatus)}
            aria-describedby={fieldError ? `${selectId}-error` : undefined}
            className="max-w-56"
          >
            {allowedStatuses.map((option) => (
              <option key={option} value={option}>
                {formatStatus(option)}
              </option>
            ))}
          </Select>
          <Button type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "Saving…" : "Update status"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">
          Current status: {formatStatus(currentStatus)}. Only valid next steps
          are offered.
        </p>
        {fieldError ? (
          <p id={`${selectId}-error`} role="alert" className="mt-1 text-sm text-red-700">
            {fieldError}
          </p>
        ) : null}
      </div>
    </form>
  );
}
