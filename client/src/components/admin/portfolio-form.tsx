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
import { PORTFOLIO_STATUS_OPTIONS } from "@/lib/admin/options";
import type { PortfolioEntry, PortfolioStatus } from "@/lib/admin/types";

type PortfolioValues = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  status: PortfolioStatus;
  technologies: string;
  features: string;
  thumbnailUrl: string;
  imageUrls: string;
  liveUrl: string;
  sourceUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  isSample: boolean;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function initialValues(entry?: PortfolioEntry): PortfolioValues {
  return {
    slug: entry?.slug ?? "",
    title: entry?.title ?? "",
    summary: entry?.summary ?? "",
    description: entry?.description ?? "",
    category: entry?.category ?? "",
    status: entry?.status ?? "CONCEPT",
    technologies: arrayToLines(entry?.technologies ?? []),
    features: arrayToLines(entry?.features ?? []),
    thumbnailUrl: entry?.thumbnailUrl ?? "",
    imageUrls: arrayToLines(entry?.imageUrls ?? []),
    liveUrl: entry?.liveUrl ?? "",
    sourceUrl: entry?.sourceUrl ?? "",
    isFeatured: entry?.isFeatured ?? false,
    isPublished: entry?.isPublished ?? false,
    isSample: entry?.isSample ?? true,
  };
}

export function PortfolioForm({
  mode,
  entry,
}: {
  mode: "create" | "edit";
  entry?: PortfolioEntry;
}) {
  const router = useRouter();
  const [values, setValues] = useState<PortfolioValues>(() => initialValues(entry));
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function update<K extends keyof PortfolioValues>(
    key: K,
    value: PortfolioValues[K],
  ) {
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
      category: values.category,
      status: values.status,
      technologies: linesToArray(values.technologies),
      features: linesToArray(values.features),
      thumbnailUrl: values.thumbnailUrl,
      imageUrls: linesToArray(values.imageUrls),
      liveUrl: values.liveUrl,
      sourceUrl: values.sourceUrl,
      isFeatured: values.isFeatured,
      isPublished: values.isPublished,
      isSample: values.isSample,
    };

    const result = await adminMutate<{ portfolio: PortfolioEntry }>(
      mode === "create" ? "/portfolio" : `/portfolio/${entry?.id}`,
      mode === "create" ? "POST" : "PATCH",
      payload,
    );

    if (!result.ok) {
      if (result.status === 401) {
        router.push(
          `/login?next=${encodeURIComponent(
            mode === "create"
              ? "/admin/portfolio/new"
              : `/admin/portfolio/${entry?.id}/edit`,
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
      router.push(`/admin/portfolio/${result.data.portfolio.id}/edit`);
      router.refresh();
      return;
    }

    setValues(initialValues(result.data.portfolio));
    setSlugTouched(true);
    setSuccess("Portfolio changes were saved.");
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <Alert tone="error" title="Could not save portfolio entry">
          {error}
        </Alert>
      ) : null}
      {success ? <Alert tone="success">{success}</Alert> : null}

      <Alert tone="warning" title="No invented achievements">
        Describe only what was designed or built. Do not add testimonials,
        ratings, client logos, or outcome metrics unless they are verified and
        approved. Mark any concept work as a sample.
      </Alert>

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="text-base font-semibold text-ink">Basics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField id="portfolio-title" label="Title" required error={fieldErrors.title}>
            <Input
              id="portfolio-title"
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
              aria-describedby={fieldDescribedBy("portfolio-title", {
                error: fieldErrors.title,
              })}
            />
          </FormField>

          <FormField
            id="portfolio-slug"
            label="URL slug"
            required={mode === "create"}
            hint={
              mode === "create"
                ? "Lower-case letters, numbers, and hyphens. This cannot be changed later."
                : "The slug is permanent to keep existing links stable."
            }
            error={fieldErrors.slug}
          >
            <Input
              id="portfolio-slug"
              value={values.slug}
              onChange={(event) => {
                setSlugTouched(true);
                update("slug", slugify(event.target.value));
              }}
              readOnly={mode === "edit"}
              disabled={mode === "edit"}
              required={mode === "create"}
              className={mode === "edit" ? "bg-canvas" : undefined}
              aria-describedby="portfolio-slug-hint"
              aria-invalid={Boolean(fieldErrors.slug)}
            />
          </FormField>

          <FormField
            id="portfolio-summary"
            label="Summary"
            required
            error={fieldErrors.summary}
            className="sm:col-span-2"
          >
            <Textarea
              id="portfolio-summary"
              rows={3}
              value={values.summary}
              onChange={(event) => update("summary", event.target.value)}
              required
              maxLength={500}
              aria-invalid={Boolean(fieldErrors.summary)}
            />
          </FormField>

          <FormField
            id="portfolio-description"
            label="Description"
            error={fieldErrors.description}
            className="sm:col-span-2"
          >
            <Textarea
              id="portfolio-description"
              rows={6}
              value={values.description}
              onChange={(event) => update("description", event.target.value)}
              maxLength={5000}
            />
          </FormField>

          <FormField id="portfolio-category" label="Category" error={fieldErrors.category}>
            <Input
              id="portfolio-category"
              value={values.category}
              onChange={(event) => update("category", event.target.value)}
              maxLength={80}
            />
          </FormField>

          <FormField id="portfolio-status" label="Project status" error={fieldErrors.status}>
            <Select
              id="portfolio-status"
              value={values.status}
              onChange={(event) =>
                update("status", event.target.value as PortfolioStatus)
              }
            >
              {PORTFOLIO_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="text-base font-semibold text-ink">Details and media</h2>
        <p className="mt-1 text-sm text-muted">
          Enter one item per line. Image and project links must be http:// or
          https:// URLs.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField id="portfolio-technologies" label="Technologies">
            <Textarea
              id="portfolio-technologies"
              rows={5}
              value={values.technologies}
              onChange={(event) => update("technologies", event.target.value)}
            />
          </FormField>
          <FormField id="portfolio-features" label="Features">
            <Textarea
              id="portfolio-features"
              rows={5}
              value={values.features}
              onChange={(event) => update("features", event.target.value)}
            />
          </FormField>
          <FormField
            id="portfolio-thumbnail"
            label="Thumbnail URL"
            error={fieldErrors.thumbnailUrl}
          >
            <Input
              id="portfolio-thumbnail"
              type="url"
              value={values.thumbnailUrl}
              onChange={(event) => update("thumbnailUrl", event.target.value)}
              placeholder="https://"
              maxLength={2048}
              aria-invalid={Boolean(fieldErrors.thumbnailUrl)}
            />
          </FormField>
          <FormField
            id="portfolio-images"
            label="Image URLs"
            hint="One URL per line, up to 8."
            error={fieldErrors.imageUrls}
          >
            <Textarea
              id="portfolio-images"
              rows={5}
              value={values.imageUrls}
              onChange={(event) => update("imageUrls", event.target.value)}
              aria-describedby="portfolio-images-hint"
            />
          </FormField>
          <FormField
            id="portfolio-live-url"
            label="Live demo URL"
            error={fieldErrors.liveUrl}
          >
            <Input
              id="portfolio-live-url"
              type="url"
              value={values.liveUrl}
              onChange={(event) => update("liveUrl", event.target.value)}
              placeholder="https://"
              maxLength={2048}
              aria-invalid={Boolean(fieldErrors.liveUrl)}
            />
          </FormField>
          <FormField
            id="portfolio-source-url"
            label="Source URL"
            hint="Only if the repository is safe to share publicly."
            error={fieldErrors.sourceUrl}
          >
            <Input
              id="portfolio-source-url"
              type="url"
              value={values.sourceUrl}
              onChange={(event) => update("sourceUrl", event.target.value)}
              placeholder="https://"
              maxLength={2048}
              aria-describedby="portfolio-source-url-hint"
              aria-invalid={Boolean(fieldErrors.sourceUrl)}
            />
          </FormField>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="text-base font-semibold text-ink">Publication</h2>
        <div className="mt-4 space-y-4">
          <CheckboxRow
            id="portfolio-sample"
            checked={values.isSample}
            onChange={(checked) => update("isSample", checked)}
            label="Sample or concept work"
            description="Leave this checked unless the work was designed and delivered for a named client with written approval."
          />
          <CheckboxRow
            id="portfolio-published"
            checked={values.isPublished}
            onChange={(checked) => {
              update("isPublished", checked);
              if (!checked) update("isFeatured", false);
            }}
            label="Published"
            description="Only published entries may be featured."
            disabled={mode === "edit" && entry?.isArchived}
          />
          <CheckboxRow
            id="portfolio-featured"
            checked={values.isFeatured}
            onChange={(checked) => update("isFeatured", checked)}
            label="Featured"
            description="Featured entries can be highlighted on a future public portfolio. This does not publish the entry by itself."
            disabled={!values.isPublished}
          />
        </div>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-line pt-5">
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create entry"
              : "Save changes"}
        </Button>
        <Link
          href={mode === "create" ? "/admin/portfolio" : `/admin/portfolio/${entry?.id}`}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface px-5 text-sm font-medium text-ink hover:bg-canvas"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function CheckboxRow({
  id,
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-line bg-canvas p-4">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="mt-1 size-4 rounded border-line text-accent-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 disabled:opacity-60"
      />
      <div>
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
      </div>
    </div>
  );
}
