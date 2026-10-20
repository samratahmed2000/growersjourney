"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Send } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/field-controls";
import { StatusBadge } from "@/components/admin/status-badge";
import { adminMutate } from "@/lib/api/admin";
import { formatDateTime } from "@/lib/admin/format";
import type {
  ProjectUpdate,
  ProjectUpdateVisibility,
} from "@/lib/admin/types";

export function ProjectUpdateManager({
  projectId,
  updates,
}: {
  projectId: string;
  updates: ProjectUpdate[];
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function createUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingAction) return;
    const form = event.currentTarget;
    const data = new FormData(form);

    setPendingAction("create");
    setError(null);
    setSuccess(null);

    const result = await adminMutate<{ update: ProjectUpdate }>(
      `/projects/${projectId}/updates`,
      "POST",
      {
        title: String(data.get("title") ?? ""),
        body: String(data.get("body") ?? ""),
        visibility: String(data.get("visibility") ?? "INTERNAL"),
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
    setSuccess(
      result.data.update.visibility === "CLIENT"
        ? "Update published to the client portal."
        : "Internal update saved.",
    );
    setPendingAction(null);
    router.refresh();
  }

  async function setVisibility(
    update: ProjectUpdate,
    visibility: ProjectUpdateVisibility,
  ) {
    if (pendingAction) return;
    setPendingAction(`visibility-${update.id}`);
    setError(null);
    setSuccess(null);

    const result = await adminMutate<{ update: ProjectUpdate }>(
      `/projects/${projectId}/updates/${update.id}`,
      "PATCH",
      { visibility },
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
      visibility === "CLIENT"
        ? "Update is now visible in the client portal."
        : "Update is now internal only.",
    );
    setPendingAction(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {error ? (
        <Alert tone="error" title="Could not update project updates">
          {error}
        </Alert>
      ) : null}
      {success ? <Alert tone="success">{success}</Alert> : null}

      <Card className="p-5">
        <h3 className="text-base font-semibold text-ink">Add an update</h3>
        <p className="mt-1 text-xs leading-5 text-muted">
          New updates default to internal. Choose “Client visible” only when the
          text is safe for the client to read.
        </p>
        <form onSubmit={createUpdate} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div>
              <label htmlFor="update-title" className="block text-sm font-medium text-ink">
                Title
              </label>
              <Input
                id="update-title"
                name="title"
                required
                minLength={2}
                maxLength={160}
                className="mt-1.5"
                placeholder="Design approved"
              />
            </div>
            <div>
              <label htmlFor="update-visibility" className="block text-sm font-medium text-ink">
                Visibility
              </label>
              <Select
                id="update-visibility"
                name="visibility"
                defaultValue="INTERNAL"
                className="mt-1.5"
              >
                <option value="INTERNAL">Internal only</option>
                <option value="CLIENT">Client visible</option>
              </Select>
            </div>
          </div>
          <div>
            <label htmlFor="update-body" className="block text-sm font-medium text-ink">
              Update
            </label>
            <Textarea
              id="update-body"
              name="body"
              rows={4}
              required
              maxLength={5000}
              className="mt-1.5"
              placeholder="What changed, what is next, and anything the client needs to do."
            />
          </div>
          <Button type="submit" disabled={pendingAction === "create"} aria-busy={pendingAction === "create"}>
            <Send aria-hidden="true" className="size-4" />
            {pendingAction === "create" ? "Saving…" : "Add update"}
          </Button>
        </form>
      </Card>

      {updates.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-surface p-5 text-sm text-muted">
          No progress updates yet. The first update can be internal or
          client-visible.
        </p>
      ) : (
        <ol className="space-y-3">
          {updates.map((update) => (
            <li key={update.id}>
              <Card className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-ink">{update.title}</h3>
                    <p className="mt-1 text-xs text-muted">
                      {update.authorName} · {formatDateTime(update.createdAt)}
                    </p>
                  </div>
                  <StatusBadge
                    status={update.visibility}
                    tone={update.visibility === "CLIENT" ? "accent" : "warning"}
                  />
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink">
                  {update.body}
                </p>
                <div className="mt-4 border-t border-line pt-3">
                  <Button
                    variant="secondary"
                    disabled={pendingAction === `visibility-${update.id}`}
                    onClick={() =>
                      void setVisibility(
                        update,
                        update.visibility === "CLIENT" ? "INTERNAL" : "CLIENT",
                      )
                    }
                  >
                    {update.visibility === "CLIENT" ? (
                      <>
                        <EyeOff aria-hidden="true" className="size-4" />
                        Make internal
                      </>
                    ) : (
                      <>
                        <Eye aria-hidden="true" className="size-4" />
                        Publish to client
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
