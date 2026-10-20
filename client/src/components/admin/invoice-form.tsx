"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/admin/form-field";
import { adminMutate } from "@/lib/api/admin";
import { majorToMinor, minorToMajor } from "@/lib/admin/format";
import type {
  ClientSummary,
  InvoiceDetail,
  ProjectSummary,
} from "@/lib/admin/types";

type LineDraft = {
  key: string;
  description: string;
  quantity: string;
  unitAmount: string;
};

let nextLineKey = 1;

function blankLine(): LineDraft {
  return {
    key: `line-${nextLineKey++}`,
    description: "",
    quantity: "1",
    unitAmount: "",
  };
}

function dateInput(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

export function InvoiceForm({
  clients,
  projects,
  invoice,
}: {
  clients: ClientSummary[];
  projects: ProjectSummary[];
  invoice?: InvoiceDetail;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(
    invoice?.client?.id ?? clients[0]?.id ?? "",
  );
  const [projectId, setProjectId] = useState(invoice?.project?.id ?? "");
  const [currency, setCurrency] = useState(invoice?.currency ?? "BDT");
  const [invoiceNumber, setInvoiceNumber] = useState(
    invoice?.invoiceNumber ?? "",
  );
  const [issueDate, setIssueDate] = useState(dateInput(invoice?.issueDate ?? null));
  const [dueDate, setDueDate] = useState(dateInput(invoice?.dueDate ?? null));
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [internalNotes, setInternalNotes] = useState(invoice?.internalNotes ?? "");
  const [lines, setLines] = useState<LineDraft[]>(
    invoice && invoice.lineItems.length > 0
      ? invoice.lineItems.map((item, index) => ({
          key: `existing-${index}`,
          description: item.description,
          quantity: item.quantity,
          unitAmount: minorToMajor(item.unitAmountMinor),
        }))
      : [blankLine()],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const activeProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.client?.id === clientId &&
          (project.status !== "CANCELLED" || project.id === projectId),
      ),
    [projects, clientId, projectId],
  );

  const subtotalMinor = lines.reduce((total, line) => {
    const quantity = Number(line.quantity);
    const unit = majorToMinor(line.unitAmount);
    if (!Number.isFinite(quantity) || !Number.isFinite(unit)) return total;
    return total + Math.round(quantity * unit);
  }, 0);

  function updateLine(key: string, changes: Partial<LineDraft>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...changes } : line)),
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setMessage(null);

    if (!clientId) {
      setErrors({ clientId: "Select a client." });
      return;
    }
    if (lines.length === 0) {
      setErrors({ lineItems: "Add at least one line item." });
      return;
    }

    const lineItems = [];
    for (const [index, line] of lines.entries()) {
      const unitAmountMinor = majorToMinor(line.unitAmount);
      if (!line.description.trim()) {
        setErrors({ [`lineItems.${index}.description`]: "Enter a line description." });
        return;
      }
      if (!/^\d+(\.\d{1,3})?$/.test(line.quantity) || Number(line.quantity) <= 0) {
        setErrors({ [`lineItems.${index}.quantity`]: "Enter a positive quantity." });
        return;
      }
      if (!Number.isInteger(unitAmountMinor) || unitAmountMinor < 0) {
        setErrors({ [`lineItems.${index}.unitAmountMinor`]: "Enter a valid unit price." });
        return;
      }
      lineItems.push({
        description: line.description.trim(),
        quantity: line.quantity,
        unitAmountMinor,
      });
    }

    // On create, omit empty optional fields. The create schema treats an empty
    // value as absent; only the update schema uses `null` to clear a field.
    const emptyOptional = invoice ? null : undefined;
    const payload = {
      clientId,
      projectId: projectId || emptyOptional,
      currency,
      invoiceNumber: invoiceNumber.trim() || emptyOptional,
      issueDate: issueDate || emptyOptional,
      dueDate: dueDate || emptyOptional,
      notes: notes.trim() || emptyOptional,
      internalNotes: internalNotes.trim() || emptyOptional,
      lineItems,
    };

    setPending(true);
    const result = await adminMutate<{ invoice: InvoiceDetail }>(
      invoice ? `/invoices/${invoice.id}` : "/invoices",
      invoice ? "PATCH" : "POST",
      payload,
    );
    setPending(false);

    if (!result.ok) {
      setMessage(result.message);
      setErrors(result.fieldErrors);
      return;
    }

    router.push(`/admin/invoices/${result.data.invoice.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {message ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {message}
        </p>
      ) : null}

      <Card className="p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="invoice-client" label="Client" required error={errors.clientId}>
            <select
              id="invoice-client"
              value={clientId}
              onChange={(event) => {
                const value = event.target.value;
                setClientId(value);
                const projectStillValid = projects.some(
                  (project) =>
                    project.id === projectId && project.client?.id === value,
                );
                if (!projectStillValid) setProjectId("");
              }}
              className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
              required
            >
              {clients.length === 0 ? <option value="">No clients</option> : null}
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.displayName}
                  {client.companyName ? ` — ${client.companyName}` : ""}
                  {client.status !== "ACTIVE" ? " (inactive)" : ""}
                </option>
              ))}
            </select>
          </FormField>

          <FormField id="invoice-project" label="Project (optional)" hint="Only projects belonging to the selected client are shown." error={errors.projectId}>
            <select
              id="invoice-project"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
            >
              <option value="">No project</option>
              {activeProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField id="invoice-number" label="Invoice number" hint="Leave blank to generate one at issue." error={errors.invoiceNumber}>
            <input
              id="invoice-number"
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
              maxLength={40}
              className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm uppercase text-ink focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
              placeholder="INV-2026-000001"
            />
          </FormField>

          <FormField id="invoice-currency" label="Currency" required>
            <select
              id="invoice-currency"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
            >
              <option value="BDT">BDT</option>
            </select>
          </FormField>

          <FormField id="invoice-issue-date" label="Issue date" error={errors.issueDate}>
            <input
              id="invoice-issue-date"
              type="date"
              value={issueDate}
              onChange={(event) => setIssueDate(event.target.value)}
              className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
            />
          </FormField>

          <FormField id="invoice-due-date" label="Due date" hint="Required before the invoice can be issued." error={errors.dueDate}>
            <input
              id="invoice-due-date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
            />
          </FormField>
        </div>
      </Card>

      <section aria-labelledby="invoice-lines-heading">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 id="invoice-lines-heading" className="text-lg font-semibold text-ink">
              Line items
            </h2>
            <p className="mt-1 text-sm text-muted">
              Amounts are in {currency}. The server calculates the subtotal and
              totals.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setLines((current) => [...current, blankLine()])}
            disabled={lines.length >= 50}
          >
            <Plus aria-hidden="true" className="size-4" />
            Add line
          </Button>
        </div>

        {errors.lineItems ? (
          <p role="alert" className="mb-2 text-sm text-red-700">
            {errors.lineItems}
          </p>
        ) : null}

        <div className="space-y-3">
          {lines.map((line, index) => (
            <Card key={line.key} className="p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_7rem_9rem_auto] md:items-end">
                <FormField id={`line-${index}-description`} label="Description" required error={errors[`lineItems.${index}.description`]}>
                  <input
                    id={`line-${index}-description`}
                    value={line.description}
                    onChange={(event) =>
                      updateLine(line.key, { description: event.target.value })
                    }
                    maxLength={300}
                    className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
                  />
                </FormField>
                <FormField id={`line-${index}-quantity`} label="Qty" required error={errors[`lineItems.${index}.quantity`]}>
                  <input
                    id={`line-${index}-quantity`}
                    value={line.quantity}
                    onChange={(event) =>
                      updateLine(line.key, { quantity: event.target.value })
                    }
                    inputMode="decimal"
                    className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
                  />
                </FormField>
                <FormField id={`line-${index}-unit`} label={`Unit (${currency})`} required error={errors[`lineItems.${index}.unitAmountMinor`]}>
                  <input
                    id={`line-${index}-unit`}
                    value={line.unitAmount}
                    onChange={(event) =>
                      updateLine(line.key, { unitAmount: event.target.value })
                    }
                    inputMode="decimal"
                    placeholder="0.00"
                    className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
                  />
                </FormField>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setLines((current) =>
                      current.length === 1
                        ? current
                        : current.filter((item) => item.key !== line.key),
                    )
                  }
                  disabled={lines.length === 1}
                  aria-label={`Remove line ${index + 1}`}
                  className="md:mb-0"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <p className="text-sm text-muted">
            Estimated subtotal:{" "}
            <span className="font-semibold text-ink">
              {currency} {(subtotalMinor / 100).toFixed(2)}
            </span>
          </p>
        </div>
      </section>

      <Card className="p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="invoice-notes" label="Notes visible to the client" error={errors.notes}>
            <textarea
              id="invoice-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              maxLength={2000}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
            />
          </FormField>
          <FormField id="invoice-internal-notes" label="Internal notes" hint="Never shown in the client portal or print view." error={errors.internalNotes}>
            <textarea
              id="invoice-internal-notes"
              value={internalNotes}
              onChange={(event) => setInternalNotes(event.target.value)}
              rows={4}
              maxLength={2000}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
            />
          </FormField>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link
          href={invoice ? `/admin/invoices/${invoice.id}` : "/admin/invoices"}
          className="text-sm font-medium text-muted hover:text-ink"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : invoice
              ? "Save draft"
              : "Create draft invoice"}
        </Button>
      </div>
    </form>
  );
}
