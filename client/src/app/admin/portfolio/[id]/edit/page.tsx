import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminErrorState } from "@/components/admin/error-state";
import { PortfolioForm } from "@/components/admin/portfolio-form";
import { adminGet } from "@/lib/api/admin.server";
import type { PortfolioEntry } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Edit portfolio entry",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminEditPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await adminGet<{ portfolio: PortfolioEntry }>(
    `/admin/portfolio/${encodeURIComponent(id)}`,
  );

  if (!result.ok) {
    if (result.status === 401) {
      redirect(
        `/login?next=${encodeURIComponent(`/admin/portfolio/${id}/edit`)}`,
      );
    }
    if (result.status === 404 || result.status === 400) notFound();
    return (
      <AdminErrorState
        message={result.message}
        retryHref={`/admin/portfolio/${id}/edit`}
      />
    );
  }

  const entry = result.data.portfolio;

  return (
    <>
      <Link
        href={`/admin/portfolio/${entry.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to portfolio entry
      </Link>
      <AdminPageHeader
        eyebrow="Portfolio"
        title="Edit portfolio entry"
        description={entry.title}
      />
      <PortfolioForm mode="edit" entry={entry} />
    </>
  );
}
