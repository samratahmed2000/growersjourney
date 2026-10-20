import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FilterBar, FilterActions } from "@/components/admin/filter-bar";
import { FilterField, Input, Select } from "@/components/admin/filter-controls";
import { DataTable } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminErrorState } from "@/components/admin/error-state";
import { PaginationBar } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { adminGet } from "@/lib/api/admin.server";
import { formatDate } from "@/lib/admin/format";
import { portfolioTone } from "@/lib/admin/status";
import {
  firstValue,
  parsePositiveInt,
  toQuery,
  type RawSearchParams,
} from "@/lib/admin/search-params";
import type {
  ListResult,
  PortfolioEntry,
} from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Portfolio",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminPortfolioPage({
  searchParams,
}: {
  searchParams: RawSearchParams;
}) {
  const raw = await searchParams;
  const page = parsePositiveInt(firstValue(raw.page), 1, 10_000);
  const search = firstValue(raw.search);
  const published = firstValue(raw.published);
  const featured = firstValue(raw.featured);
  const includeArchived = firstValue(raw.includeArchived);

  const apiQuery = toQuery({
    page,
    limit: 20,
    search: search || undefined,
    published:
      published === "true" || published === "false" ? published : undefined,
    featured:
      featured === "true" || featured === "false" ? featured : undefined,
    includeArchived:
      includeArchived === "true" || includeArchived === "false"
        ? includeArchived
        : undefined,
    sort: "updatedAt",
    order: "desc",
  });

  const result = await adminGet<ListResult<PortfolioEntry>["data"]>(
    `/admin/portfolio${apiQuery}`,
  );

  if (!result.ok) {
    if (result.status === 401) redirect("/login?next=/admin/portfolio");
    return <AdminErrorState message={result.message} retryHref="/admin/portfolio" />;
  }

  const items = result.data.items;
  const hasFilters = Boolean(search || published || featured || includeArchived);

  return (
    <>
      <AdminPageHeader
        eyebrow="Content"
        title="Portfolio"
        description="Manage labelled concept work and approved case studies. Do not publish invented achievements, testimonials, or client claims."
        actions={
          <ButtonLink href="/admin/portfolio/new">
            <Plus aria-hidden="true" className="size-4" />
            Add entry
          </ButtonLink>
        }
      />

      <FilterBar>
        <FilterField id="portfolio-search" label="Search">
          <Input
            id="portfolio-search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Title, slug, or category"
            maxLength={100}
          />
        </FilterField>
        <FilterField id="portfolio-published-filter" label="Publication">
          <Select
            id="portfolio-published-filter"
            name="published"
            defaultValue={published ?? ""}
          >
            <option value="">Any publication state</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </Select>
        </FilterField>
        <FilterField id="portfolio-featured-filter" label="Featured">
          <Select
            id="portfolio-featured-filter"
            name="featured"
            defaultValue={featured ?? ""}
          >
            <option value="">Any</option>
            <option value="true">Featured only</option>
            <option value="false">Not featured</option>
          </Select>
        </FilterField>
        <FilterField id="portfolio-archived-filter" label="Archive">
          <Select
            id="portfolio-archived-filter"
            name="includeArchived"
            defaultValue={includeArchived ?? "false"}
          >
            <option value="false">Active records</option>
            <option value="true">Include archived</option>
          </Select>
        </FilterField>
        <FilterActions resetHref="/admin/portfolio" />
      </FilterBar>

      {items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No matching portfolio entries" : "No portfolio entries yet"}
          description={
            hasFilters
              ? "Try a different search or remove one of the publication filters."
              : "Add a clearly labelled concept or an approved case study. No sample records are inserted automatically."
          }
          action={
            hasFilters ? undefined : (
              <ButtonLink href="/admin/portfolio/new">Add the first entry</ButtonLink>
            )
          }
        />
      ) : (
        <>
          <DataTable
            caption="Portfolio content records"
            columns={[
              { label: "Entry" },
              { label: "Category" },
              { label: "Status" },
              { label: "Publication" },
              { label: "Updated" },
              { label: "Action" },
            ]}
            rows={items.map((entry) => ({
              id: entry.id,
              cells: [
                <div key="entry">
                  <Link
                    href={`/admin/portfolio/${entry.id}`}
                    className="font-medium text-accent-600 hover:underline"
                  >
                    {entry.title}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    /{entry.slug}
                  </p>
                  {entry.isSample ? (
                    <p className="mt-1 text-xs text-amber-800">Sample concept</p>
                  ) : null}
                </div>,
                entry.category ?? "—",
                <StatusBadge
                  key="status"
                  status={entry.status}
                  tone={portfolioTone(entry.status)}
                />,
                <div key="publication" className="flex flex-wrap gap-1.5">
                  {entry.isArchived ? (
                    <StatusBadge status="Archived" tone="danger" />
                  ) : entry.isPublished ? (
                    <StatusBadge status="Published" tone="accent" />
                  ) : (
                    <StatusBadge status="Draft" tone="neutral" />
                  )}
                  {entry.isFeatured ? (
                    <StatusBadge status="Featured" tone="brand" />
                  ) : null}
                </div>,
                <span key="updated" className="text-muted">
                  {formatDate(entry.updatedAt)}
                </span>,
                <Link
                  key="action"
                  href={`/admin/portfolio/${entry.id}`}
                  className="font-medium text-accent-600 hover:underline"
                >
                  Open
                </Link>,
              ],
            }))}
          />
          {result.pagination ? (
            <PaginationBar
              basePath="/admin/portfolio"
              query={raw}
              pagination={result.pagination}
            />
          ) : null}
        </>
      )}
    </>
  );
}
