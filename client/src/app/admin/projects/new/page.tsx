import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminErrorState } from "@/components/admin/error-state";
import { EmptyState } from "@/components/admin/empty-state";
import { ProjectForm } from "@/components/admin/project-form";
import { ButtonLink } from "@/components/ui/button";
import { adminGet } from "@/lib/api/admin.server";
import type { ClientSummary } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "New project",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminNewProjectPage() {
  const result = await adminGet<{ items: ClientSummary[] }>(
    "/admin/clients?limit=100&sort=displayName&order=asc",
  );

  if (!result.ok) {
    if (result.status === 401) redirect("/login?next=/admin/projects/new");
    return (
      <AdminErrorState
        message={result.message}
        retryHref="/admin/projects/new"
      />
    );
  }

  const clients = result.data.items;

  return (
    <>
      <Link
        href="/admin/projects"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to projects
      </Link>

      <AdminPageHeader
        eyebrow="Delivery"
        title="New project"
        description="Create a real project for an active client. It starts in planning and can be moved through the approved status flow."
      />

      {clients.length === 0 ? (
        <EmptyState
          title="Add a client first"
          description="A project must belong to a client record. Create the client, then return here."
          action={
            <ButtonLink href="/admin/clients/new">Add a client</ButtonLink>
          }
        />
      ) : (
        <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
          <ProjectForm mode="create" clients={clients} />
        </div>
      )}
    </>
  );
}
