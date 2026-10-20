"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field-controls";
import { Alert } from "@/components/ui/alert";
import { FormField, fieldDescribedBy } from "./form-field";
import { adminMutate } from "@/lib/api/admin";
import { arrayToLines, linesToArray } from "@/lib/admin/format";
import { SERVICE_ICON_OPTIONS } from "@/lib/admin/options";
import type { Service } from "@/lib/admin/types";

type ServiceValues = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  icon: string;
  audience: string;
  problems: string;
  deliverables: string;
  capabilities: string;
  technologies: string;
  isPublished: boolean;
  sortOrder: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function initialValues(service?: Service): ServiceValues {
  return {
    slug: service?.slug ?? "",
    title: service?.title ?? "",
    summary: service?.summary ?? "",
    description: service?.description ?? "",
    icon: service?.icon ?? "sparkles",
    audience: service?.audience ?? "",
    problems: arrayToLines(service?.problems ?? []),
    deliverables: arrayToLines(service?.deliverables ?? []),
    capabilities: arrayToLines(service?.capabilities ?? []),
    technologies: arrayToLines(service?.technologies ?? []),
    isPublished: service?.isPublished ?? false,
    sortOrder: String(service?.sortOrder ?? 0),
  };
}

export function ServiceForm({
  mode,
  service,
}: {
  mode: "create" | "edit";
  service?: Service;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ServiceValues>(() => initialValues(service));
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function update<K extends keyof ServiceValues>(key: K, value: ServiceValues[K]) {
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
      ...(mode === "create" ? { slug: values.slug } : {}),
      title: values.title,
      summary: values.summary,
      description: values.description,
      icon: values.icon,
      audience: values.audience,
      problems: linesToArray(values.problems),
      deliverables: linesToArray(values.deliverables),
      capabilities: linesToArray(values.capabilities),
      technologies: linesToArray(values.technologies),
      isPublished: values.isPublished,
      sortOrder: Number(values.sortOrder),
    };

    const result = await adminMutate<{ service: Service }>(
      mode === "create" ? "/services" : `/services/${service?.id}`,
      mode === "create" ? "POST" : "PATCH",
      payload,
    );

    if (!result.ok) {
      if (result.status === 401) {
        router.push(
          `/login?next=${encodeURIComponent(
            mode === "create" ? "/admin/services/new" : `/admin/services/${service?.id}/edit`,
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
      router.push(`/admin/services/${result.data.service.id}/edit`);
      router.refresh();
      return;
    }

    setValues(initialValues(result.data.service));
    setSlugTouched(true);
    setSuccess("Service changes were saved.");
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? <Alert tone="error" title="Could not save service">{error}</Alert> : null}
      {success ? <Alert tone="success">{success}</Alert> : null}

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="text-base font-semibold text-ink">Basics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField
            id="service-title"
            label="Title"
            required
            error={fieldErrors.title}
          >
            <Input
              id="service-title"
              value={values.title}
              onChange={(event) => {
                const title = event.target.value;
                update("title", title);
                if (mode === "create" && !slugTouched) {
                  update("slug", slugify(title));
                }
              }}
              required
              maxLength={120}
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldDescribedBy("service-title", {
                error: fieldErrors.title,
              })}
            />
          </FormField>

          <FormField
            id="service-slug"
            label="URL slug"
            required={mode === "create"}
            hint={
              mode === "create"
                ? "Lower-case letters, numbers, and hyphens. This cannot be changed later."
                : "The slug is permanent to keep existing links and inquiries stable."
            }
            error={fieldErrors.slug}
          >
            <Input
              id="service-slug"
              value={values.slug}
              onChange={(event) => {
                setSlugTouched(true);
                update("slug", slugify(event.target.value));
              }}
              readOnly={mode === "edit"}
              disabled={mode === "edit"}
              required={mode === "create"}
              className={mode === "edit" ? "bg-canvas" : undefined}
              aria-describedby="service-slug-hint"
              aria-invalid={Boolean(fieldErrors.slug)}
            />
          </FormField>

          <FormField
            id="service-summary"
            label="Summary"
            required
            hint="A short card and search description."
            error={fieldErrors.summary}
            className="sm:col-span-2"
          >
            <Textarea
              id="service-summary"
              rows={3}
              value={values.summary}
              onChange={(event) => update("summary", event.target.value)}
              required
              maxLength={500}
              aria-describedby="service-summary-hint"
              aria-invalid={Boolean(fieldErrors.summary)}
            />
          </FormField>

          <FormField
            id="service-description"
            label="Full description"
            error={fieldErrors.description}
            className="sm:col-span-2"
          >
            <Textarea
              id="service-description"
              rows={6}
              value={values.description}
              onChange={(event) => update("description", event.target.value)}
              maxLength={5000}
            />
          </FormField>

          <FormField id="service-icon" label="Icon" error={fieldErrors.icon}>
            <Select
              id="service-icon"
              value={values.icon}
              onChange={(event) => update("icon", event.target.value)}
            >
              {SERVICE_ICON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            id="service-audience"
            label="Who it is for"
            error={fieldErrors.audience}
          >
            <Input
              id="service-audience"
              value={values.audience}
              onChange={(event) => update("audience", event.target.value)}
              maxLength={1000}
            />
          </FormField>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="text-base font-semibold text-ink">Content lists</h2>
        <p className="mt-1 text-sm text-muted">
          Enter one item per line. Blank lines are ignored.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField id="service-problems" label="Problems addressed">
            <Textarea
              id="service-problems"
              rows={5}
              value={values.problems}
              onChange={(event) => update("problems", event.target.value)}
            />
          </FormField>
          <FormField id="service-deliverables" label="Deliverables">
            <Textarea
              id="service-deliverables"
              rows={5}
              value={values.deliverables}
              onChange={(event) => update("deliverables", event.target.value)}
            />
          </FormField>
          <FormField id="service-capabilities" label="Capabilities">
            <Textarea
              id="service-capabilities"
              rows={5}
              value={values.capabilities}
              onChange={(event) => update("capabilities", event.target.value)}
            />
          </FormField>
          <FormField id="service-technologies" label="Technologies">
            <Textarea
              id="service-technologies"
              rows={5}
              value={values.technologies}
              onChange={(event) => update("technologies", event.target.value)}
            />
          </FormField>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="text-base font-semibold text-ink">Publication</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField
            id="service-sort-order"
            label="Sort order"
            hint="Lower numbers appear first in the admin list."
            error={fieldErrors.sortOrder}
          >
            <Input
              id="service-sort-order"
              type="number"
              min={0}
              max={9999}
              value={values.sortOrder}
              onChange={(event) => update("sortOrder", event.target.value)}
              aria-describedby="service-sort-order-hint"
            />
          </FormField>

          <div className="flex items-start gap-3 rounded-lg border border-line bg-canvas p-4">
            <input
              id="service-published"
              type="checkbox"
              checked={values.isPublished}
              onChange={(event) => update("isPublished", event.target.checked)}
              disabled={mode === "edit" && service?.isArchived}
              className="mt-1 size-4 rounded border-line text-accent-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600"
            />
            <div>
              <label htmlFor="service-published" className="text-sm font-medium text-ink">
                Published
              </label>
              <p className="mt-1 text-xs leading-5 text-muted">
                Published records are included in the admin&apos;s published
                filter. The public website still uses its static service content
                until a separate migration is approved.
                {mode === "edit" && service?.isArchived
                  ? " Restore this service before publishing it."
                  : ""}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-line pt-5">
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create service" : "Save changes"}
        </Button>
        <Link
          href={mode === "create" ? "/admin/services" : `/admin/services/${service?.id}`}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface px-5 text-sm font-medium text-ink hover:bg-canvas"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
