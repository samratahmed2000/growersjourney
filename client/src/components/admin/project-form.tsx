"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field-controls";
import { adminMutate } from "@/lib/api/admin";
import type { ClientSummary, ProjectDetail } from "@/lib/admin/types";
import { FormField, fieldDescribedBy } from "./form-field";

type LinkValue = { label: string; url: string };

type ProjectValues = {
  name: string;
  description: string;
  clientId: string;
  startDate: string;
  dueDate: string;
  links: LinkValue[];
};

function toDateInput(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

function initialValues(project?: ProjectDetail): ProjectValues {
  return {
    name: project?.name ?? "",
    description: project?.description ?? "",
    clientId: project?.client?.id ?? "",
    startDate: toDateInput(project?.startDate ?? null),
    dueDate: toDateInput(project?.dueDate ?? null),
    links: project?.links.map((link) => ({ ...link })) ?? [],
  };
}

export function ProjectForm({
  mode,
  project,
  clients,
}: {
  mode: "create" | "edit";
  project?: ProjectDetail;
  clients: ClientSummary[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProjectValues>(() => initialValues(project));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function update<K extends keyof ProjectValues>(key: K, value: ProjectValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateLink(index: number, key: keyof LinkValue, value: string) {
    setValues((current) => ({
      ...current,
      links: current.links.map((link, linkIndex) =>
        linkIndex === index ? { ...link, [key]: value } : link,
      ),
    }));
  }

  function addLink() {
    setValues((current) =>
      current.links.length >= 10
        ? current
        : { ...current, links: [...current.links, { label: "", url: "" }] },
    );
  }

  function removeLink(index: number) {
    setValues((current) => ({
      ...current,
      links: current.links.filter((_, linkIndex) => linkIndex !== index),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const payload: Record<string, unknown> = {
      name: values.name,
      description: values.description,
      clientId: values.clientId,
      links: values.links
        .filter((link) => link.label.trim() || link.url.trim())
        .map((link) => ({ label: link.label.trim(), url: link.url.trim() })),
    };

    if (values.startDate) payload.startDate = values.startDate;
    else if (mode === "edit") payload.startDate = null;

    if (values.dueDate) payload.dueDate = values.dueDate;
    else if (mode === "edit") payload.dueDate = null;

    const result = await adminMutate<{ project: ProjectDetail }>(
      mode === "create" ? "/projects" : `/projects/${project?.id}`,
      mode === "create" ? "POST" : "PATCH",
      payload,
    );

    if (!result.ok) {
      if (result.status === 401) {
        router.push(
          `/login?next=${encodeURIComponent(
            mode === "create"
              ? "/admin/projects/new"
              : `/admin/projects/${project?.id}`,
          )}`,
        );
        return;
      }
      setError(result.message);
      setFieldErrors(result.fieldErrors);
      setPending(false);
      return;
    }

    if (mode === "create") {
      router.push(`/admin/projects/${result.data.project.id}`);
      router.refresh();
      return;
    }

    setValues(initialValues(result.data.project));
    setSuccess("Project details were saved.");
    setPending(false);
    router.refresh();
  }

  const hasLinkError = Object.keys(fieldErrors).some((key) =>
    key.startsWith("links"),
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <Alert tone="error" title="Could not save project">
          {error}
          {hasLinkError ? (
            <p className="mt-1">
              Check each project link: both a label and a valid http(s) URL are
              required.
            </p>
          ) : null}
        </Alert>
      ) : null}
      {success ? <Alert tone="success">{success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="project-name"
          label="Project name"
          required
          error={fieldErrors.name}
          className="sm:col-span-2"
        >
          <Input
            id="project-name"
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            required
            maxLength={160}
            aria-describedby={fieldDescribedBy("project-name", {
              error: fieldErrors.name,
            })}
            aria-invalid={Boolean(fieldErrors.name)}
          />
        </FormField>

        <FormField
          id="project-client"
          label="Client"
          required
          hint="Only an active client can receive a new project."
          error={fieldErrors.clientId}
        >
          <Select
            id="project-client"
            value={values.clientId}
            onChange={(event) => update("clientId", event.target.value)}
            required
            aria-describedby="project-client-hint"
          >
            <option value="">Choose a client</option>
            {clients.map((client) => (
              <option
                key={client.id}
                value={client.id}
                disabled={mode === "create" && client.status !== "ACTIVE"}
              >
                {client.displayName}
                {client.companyName ? ` — ${client.companyName}` : ""}
                {client.status !== "ACTIVE" ? " (inactive)" : ""}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          id="project-start"
          label="Start date"
          hint="Stored as a calendar date in UTC."
          error={fieldErrors.startDate}
        >
          <Input
            id="project-start"
            type="date"
            value={values.startDate}
            onChange={(event) => update("startDate", event.target.value)}
            aria-describedby="project-start-hint"
          />
        </FormField>

        <FormField
          id="project-due"
          label="Expected completion"
          hint="Cannot be before the start date."
          error={fieldErrors.dueDate}
        >
          <Input
            id="project-due"
            type="date"
            value={values.dueDate}
            onChange={(event) => update("dueDate", event.target.value)}
            aria-describedby="project-due-hint"
          />
        </FormField>

        <FormField
          id="project-description"
          label="Description"
          hint="Visible to the client in the portal."
          error={fieldErrors.description}
          className="sm:col-span-2"
        >
          <Textarea
            id="project-description"
            rows={5}
            value={values.description}
            onChange={(event) => update("description", event.target.value)}
            maxLength={5000}
            aria-describedby="project-description-hint"
          />
        </FormField>
      </div>

      <fieldset className="rounded-xl border border-line p-4">
        <legend className="px-1 text-sm font-medium text-ink">
          Project links
        </legend>
        <p className="text-xs leading-5 text-muted">
          Safe external http(s) links only, such as a shared brief or design file.
          File uploads are not supported in this release.
        </p>

        {values.links.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No links added.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {values.links.map((link, index) => (
              <li
                key={index}
                className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto]"
              >
                <div>
                  <label
                    htmlFor={`project-link-label-${index}`}
                    className="block text-xs font-medium text-muted"
                  >
                    Label
                  </label>
                  <Input
                    id={`project-link-label-${index}`}
                    value={link.label}
                    onChange={(event) =>
                      updateLink(index, "label", event.target.value)
                    }
                    placeholder="Project brief"
                    maxLength={80}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`project-link-url-${index}`}
                    className="block text-xs font-medium text-muted"
                  >
                    URL
                  </label>
                  <Input
                    id={`project-link-url-${index}`}
                    value={link.url}
                    onChange={(event) =>
                      updateLink(index, "url", event.target.value)
                    }
                    placeholder="https://example.com/brief"
                    maxLength={2048}
                    inputMode="url"
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    onClick={() => removeLink(index)}
                    aria-label={`Remove link ${index + 1}`}
                    className="border-red-200 text-red-800 hover:bg-red-50"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {values.links.length < 10 ? (
          <Button
            variant="secondary"
            onClick={addLink}
            className="mt-3"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add link
          </Button>
        ) : null}
      </fieldset>

      <div className="flex flex-wrap gap-3 border-t border-line pt-5">
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create project"
              : "Save project"}
        </Button>
        <Link
          href={
            mode === "create" ? "/admin/projects" : `/admin/projects/${project?.id}`
          }
          className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface px-5 text-sm font-medium text-ink hover:bg-canvas"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
