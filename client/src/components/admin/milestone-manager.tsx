"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/field-controls";
import { StatusBadge } from "@/components/admin/status-badge";
import { adminMutate } from "@/lib/api/admin";
import { formatDate, formatStatus } from "@/lib/admin/format";
import { milestoneTone } from "@/lib/admin/status";
import type { Milestone, MilestoneStatus } from "@/lib/admin/types";

function toDateInput(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

export function MilestoneManager({
  projectId,
  milestones,
  projectStartDate,
  projectDueDate,
}: {
  projectId: string;
  milestones: Milestone[];
  projectStartDate: string | null;
  projectDueDate: string | null;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function createMilestone(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingAction) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const dueDate = String(data.get("dueDate") ?? "");

    setPendingAction("create");
    setError(null);
    setSuccess(null);

    const result = await adminMutate<{ milestone: Milestone }>(
      `/projects/${projectId}/milestones`,
      "POST",
      {
        title: String(data.get("title") ?? ""),
        description: String(data.get("description") ?? ""),
        ...(dueDate ? { dueDate } : {}),
      },
    );

    if (!result.ok) {
      if (result.status === 401) {
        router.push(
          `/login?next=${encodeURIComponent(`/admin/projects/${projectId}`)}`,
        );
        return;
      }
      setError(result.message);
      setPendingAction(null);
      return;
    }

    form.reset();
    setSuccess(`Milestone “${result.data.milestone.title}” was added.`);
    setPendingAction(null);
    router.refresh();
  }

  async function updateStatus(event: React.FormEvent<HTMLFormElement>, milestoneId: string) {
    event.preventDefault();
    if (pendingAction) return;
    const data = new FormData(event.currentTarget);
    const status = String(data.get("status") ?? "") as MilestoneStatus;

    setPendingAction(`status-${milestoneId}`);
    setError(null);
    setSuccess(null);

    const result = await adminMutate<{ milestone: Milestone }>(
      `/projects/${projectId}/milestones/${milestoneId}`,
      "PATCH",
      { status },
    );

    if (!result.ok) {
      if (result.status === 401) {
        router.push(
          `/login?next=${encodeURIComponent(`/admin/projects/${projectId}`)}`,
        );
        return;
      }
      setError(result.message);
      setPendingAction(null);
      return;
    }

    setSuccess(
      `Milestone status changed to ${formatStatus(result.data.milestone.status)}.`,
    );
    setPendingAction(null);
    router.refresh();
  }

  async function updateDetails(
    event: React.FormEvent<HTMLFormElement>,
    milestoneId: string,
  ) {
    event.preventDefault();
    if (pendingAction) return;
    const data = new FormData(event.currentTarget);
    const dueDate = String(data.get("dueDate") ?? "");

    setPendingAction(`edit-${milestoneId}`);
    setError(null);
    setSuccess(null);

    const result = await adminMutate<{ milestone: Milestone }>(
      `/projects/${projectId}/milestones/${milestoneId}`,
      "PATCH",
      {
        title: String(data.get("title") ?? ""),
        description: String(data.get("description") ?? ""),
        dueDate: dueDate || null,
      },
    );

    if (!result.ok) {
      if (result.status === 401) {
        router.push(
          `/login?next=${encodeURIComponent(`/admin/projects/${projectId}`)}`,
        );
        return;
      }
      setError(result.message);
      setPendingAction(null);
      return;
    }

    setEditingId(null);
    setSuccess("Milestone details were saved.");
    setPendingAction(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {error ? (
        <Alert tone="error" title="Could not update milestones">
          {error}
        </Alert>
      ) : null}
      {success ? <Alert tone="success">{success}</Alert> : null}

      <Card className="p-5">
        <h3 className="text-base font-semibold text-ink">Add a milestone</h3>
        <form onSubmit={createMilestone} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="milestone-title" className="block text-sm font-medium text-ink">
                Title
              </label>
              <Input
                id="milestone-title"
                name="title"
                required
                minLength={2}
                maxLength={160}
                className="mt-1.5"
                placeholder="Design handoff"
              />
            </div>
            <div>
              <label htmlFor="milestone-due" className="block text-sm font-medium text-ink">
                Due date
              </label>
              <Input
                id="milestone-due"
                name="dueDate"
                type="date"
                min={toDateInput(projectStartDate) || undefined}
                max={toDateInput(projectDueDate) || undefined}
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <label htmlFor="milestone-description" className="block text-sm font-medium text-ink">
              Description
            </label>
            <Textarea
              id="milestone-description"
              name="description"
              rows={2}
              maxLength={2000}
              className="mt-1.5"
              placeholder="What will be delivered?"
            />
          </div>
          <Button type="submit" disabled={pendingAction === "create"} aria-busy={pendingAction === "create"}>
            <Plus aria-hidden="true" className="size-4" />
            {pendingAction === "create" ? "Adding…" : "Add milestone"}
          </Button>
        </form>
      </Card>

      {milestones.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-surface p-5 text-sm text-muted">
          No milestones yet. Add the first delivery checkpoint above.
        </p>
      ) : (
        <ol className="space-y-3">
          {milestones.map((milestone) => {
            const options = [milestone.status, ...milestone.allowedNextStatuses];
            const editing = editingId === milestone.id;

            return (
              <li key={milestone.id}>
                <Card className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-ink">{milestone.title}</h3>
                      <p className="mt-1 text-xs text-muted">
                        Due {formatDate(milestone.dueDate)}
                        {milestone.completedAt
                          ? ` · completed ${formatDate(milestone.completedAt)}`
                          : ""}
                      </p>
                    </div>
                    <StatusBadge
                      status={milestone.status}
                      tone={milestoneTone(milestone.status)}
                    />
                  </div>

                  {milestone.description ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">
                      {milestone.description}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-3">
                    <form
                      onSubmit={(event) => void updateStatus(event, milestone.id)}
                      className="flex flex-wrap items-end gap-2"
                    >
                      <div>
                        <label
                          htmlFor={`milestone-status-${milestone.id}`}
                          className="block text-xs font-medium text-muted"
                        >
                          Status
                        </label>
                        <Select
                          id={`milestone-status-${milestone.id}`}
                          name="status"
                          defaultValue={milestone.status}
                          className="mt-1 min-w-36"
                        >
                          {options.map((status) => (
                            <option key={status} value={status}>
                              {formatStatus(status)}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <Button
                        type="submit"
                        variant="secondary"
                        disabled={pendingAction === `status-${milestone.id}`}
                      >
                        {pendingAction === `status-${milestone.id}`
                          ? "Saving…"
                          : "Save status"}
                      </Button>
                    </form>

                    <Button
                      variant="secondary"
                      onClick={() => setEditingId(editing ? null : milestone.id)}
                      aria-expanded={editing}
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                      {editing ? "Close editor" : "Edit details"}
                    </Button>
                  </div>

                  {editing ? (
                    <form
                      onSubmit={(event) => void updateDetails(event, milestone.id)}
                      className="mt-4 space-y-3 rounded-lg bg-canvas p-3"
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor={`edit-title-${milestone.id}`}
                            className="block text-xs font-medium text-muted"
                          >
                            Title
                          </label>
                          <Input
                            id={`edit-title-${milestone.id}`}
                            name="title"
                            defaultValue={milestone.title}
                            required
                            minLength={2}
                            maxLength={160}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`edit-due-${milestone.id}`}
                            className="block text-xs font-medium text-muted"
                          >
                            Due date
                          </label>
                          <Input
                            id={`edit-due-${milestone.id}`}
                            name="dueDate"
                            type="date"
                            defaultValue={toDateInput(milestone.dueDate)}
                            min={toDateInput(projectStartDate) || undefined}
                            max={toDateInput(projectDueDate) || undefined}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor={`edit-description-${milestone.id}`}
                          className="block text-xs font-medium text-muted"
                        >
                          Description
                        </label>
                        <Textarea
                          id={`edit-description-${milestone.id}`}
                          name="description"
                          rows={2}
                          defaultValue={milestone.description ?? ""}
                          maxLength={2000}
                          className="mt-1"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={pendingAction === `edit-${milestone.id}`}
                      >
                        {pendingAction === `edit-${milestone.id}`
                          ? "Saving…"
                          : "Save details"}
                      </Button>
                    </form>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
