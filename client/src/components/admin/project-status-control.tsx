"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field-controls";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { adminMutate } from "@/lib/api/admin";
import { formatStatus } from "@/lib/admin/format";
import type { ProjectDetail, ProjectStatus } from "@/lib/admin/types";

export function ProjectStatusControl({
  projectId,
  currentStatus,
  allowedNextStatuses,
}: {
  projectId: string;
  currentStatus: ProjectStatus;
  allowedNextStatuses: ProjectStatus[];
}) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState<ProjectStatus | "">(
    allowedNextStatuses[0] ?? "",
  );
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function changeStatus() {
    if (!nextStatus) return;
    setPending(true);
    setError(null);

    const result = await adminMutate<{ project: ProjectDetail }>(
      `/projects/${projectId}/status`,
      "PATCH",
      { status: nextStatus },
    );

    if (!result.ok) {
      if (result.status === 401) {
        router.push(
          `/login?next=${encodeURIComponent(`/admin/projects/${projectId}`)}`,
        );
        return;
      }
      setError(result.message);
      setPending(false);
      setOpen(false);
      return;
    }

    setSuccess(
      `Project status changed from ${formatStatus(currentStatus)} to ${formatStatus(result.data.project.status)}.`,
    );
    setPending(false);
    setOpen(false);
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

      {allowedNextStatuses.length === 0 ? (
        <p className="text-sm leading-6 text-muted">
          This project is cancelled. It is a terminal state and cannot be moved
          again.
        </p>
      ) : (
        <div className="space-y-3">
          <label htmlFor="project-next-status" className="block text-sm font-medium text-ink">
            Move to
          </label>
          <Select
            id="project-next-status"
            value={nextStatus}
            onChange={(event) =>
              setNextStatus(event.target.value as ProjectStatus)
            }
          >
            {allowedNextStatuses.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            onClick={() => setOpen(true)}
            disabled={!nextStatus}
          >
            Change status
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={open}
        title="Change project status?"
        description={`The project will move from ${formatStatus(currentStatus)} to ${formatStatus(
          nextStatus || currentStatus,
        )}. This is recorded on the project timeline.`}
        confirmLabel="Change status"
        pending={pending}
        danger={nextStatus === "CANCELLED"}
        onConfirm={() => void changeStatus()}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
