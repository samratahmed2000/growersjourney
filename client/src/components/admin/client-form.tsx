"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field-controls";
import { Alert } from "@/components/ui/alert";
import { FormField, fieldDescribedBy } from "./form-field";
import { adminMutate } from "@/lib/api/admin";
import type { ClientDetail } from "@/lib/admin/types";

type ClientValues = {
  displayName: string;
  companyName: string;
  primaryEmail: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
  notes: string;
};

function initialValues(client?: ClientDetail): ClientValues {
  return {
    displayName: client?.displayName ?? "",
    companyName: client?.companyName ?? "",
    primaryEmail: client?.primaryEmail ?? "",
    phone: client?.phone ?? "",
    status: client?.status ?? "ACTIVE",
    notes: client?.notes ?? "",
  };
}

export function ClientForm({
  mode,
  client,
}: {
  mode: "create" | "edit";
  client?: ClientDetail;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ClientValues>(() => initialValues(client));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function update<K extends keyof ClientValues>(key: K, value: ClientValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const payload = {
      displayName: values.displayName,
      companyName: values.companyName,
      primaryEmail: values.primaryEmail,
      phone: values.phone,
      status: values.status,
      notes: values.notes,
    };

    const result = await adminMutate<{ client: ClientDetail }>(
      mode === "create" ? "/clients" : `/clients/${client?.id}`,
      mode === "create" ? "POST" : "PATCH",
      payload,
    );

    if (!result.ok) {
      if (result.status === 401) {
        router.push(
          `/login?next=${encodeURIComponent(
            mode === "create" ? "/admin/clients/new" : `/admin/clients/${client?.id}/edit`,
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
      router.push(`/admin/clients/${result.data.client.id}`);
      router.refresh();
      return;
    }

    setValues(initialValues(result.data.client));
    setSuccess("Client details were saved.");
    setPending(false);
    router.refresh();
  }

  const nameDescribedBy = fieldDescribedBy("client-name", {
    error: fieldErrors.displayName,
  });
  const emailDescribedBy = fieldDescribedBy("client-email", {
    error: fieldErrors.primaryEmail,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? <Alert tone="error" title="Could not save client">{error}</Alert> : null}
      {success ? <Alert tone="success">{success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="client-name"
          label="Client name"
          required
          error={fieldErrors.displayName}
        >
          <Input
            id="client-name"
            value={values.displayName}
            onChange={(event) => update("displayName", event.target.value)}
            autoComplete="name"
            required
            aria-describedby={nameDescribedBy}
            aria-invalid={Boolean(fieldErrors.displayName)}
          />
        </FormField>

        <FormField
          id="client-company"
          label="Company"
          error={fieldErrors.companyName}
        >
          <Input
            id="client-company"
            value={values.companyName}
            onChange={(event) => update("companyName", event.target.value)}
            autoComplete="organization"
            aria-describedby={fieldDescribedBy("client-company", {
              error: fieldErrors.companyName,
            })}
            aria-invalid={Boolean(fieldErrors.companyName)}
          />
        </FormField>

        <FormField
          id="client-email"
          label="Primary email"
          required
          hint="Used for contact only. This does not create a portal login."
          error={fieldErrors.primaryEmail}
        >
          <Input
            id="client-email"
            type="email"
            value={values.primaryEmail}
            onChange={(event) => update("primaryEmail", event.target.value)}
            autoComplete="email"
            required
            aria-describedby={`client-email-hint${emailDescribedBy ? ` ${emailDescribedBy}` : ""}`}
            aria-invalid={Boolean(fieldErrors.primaryEmail)}
          />
        </FormField>

        <FormField id="client-phone" label="Phone" error={fieldErrors.phone}>
          <Input
            id="client-phone"
            type="tel"
            value={values.phone}
            onChange={(event) => update("phone", event.target.value)}
            autoComplete="tel"
            aria-describedby={fieldDescribedBy("client-phone", {
              error: fieldErrors.phone,
            })}
            aria-invalid={Boolean(fieldErrors.phone)}
          />
        </FormField>

        <FormField
          id="client-status"
          label="Status"
          hint="Inactive clients keep their history and project links."
          error={fieldErrors.status}
        >
          <Select
            id="client-status"
            value={values.status}
            onChange={(event) =>
              update("status", event.target.value as ClientValues["status"])
            }
            aria-describedby="client-status-hint"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </FormField>
      </div>

      <FormField
        id="client-notes"
        label="Internal notes"
        hint="Admin-only. Never shown on the public site."
        error={fieldErrors.notes}
      >
        <Textarea
          id="client-notes"
          rows={5}
          value={values.notes}
          onChange={(event) => update("notes", event.target.value)}
          aria-describedby="client-notes-hint"
          maxLength={5000}
        />
      </FormField>

      <div className="flex flex-wrap gap-3 border-t border-line pt-5">
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create client" : "Save changes"}
        </Button>
        <Link
          href={mode === "create" ? "/admin/clients" : `/admin/clients/${client?.id}`}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface px-5 text-sm font-medium text-ink hover:bg-canvas"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
