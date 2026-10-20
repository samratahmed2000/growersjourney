import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminErrorState } from "@/components/admin/error-state";
import { InvoiceForm } from "@/components/admin/invoice-form";
import { Card } from "@/components/ui/card";
import { adminGet } from "@/lib/api/admin.server";
import type { ClientSummary, ProjectSummary } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "New invoice",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function NewInvoicePage() {
  const [clientsResult, projectsResult] = await Promise.all([
    adminGet<{ items: ClientSummary[] }>(
      "/admin/clients?limit=100&sort=displayName&order=asc",
    ),
    adminGet<{ items: ProjectSummary[] }>(
      "/admin/projects?limit=100&sort=name&order=asc",
    ),
  ]);

  if (!clientsResult.ok) {
    if (clientsResult.status === 401) redirect("/login?next=/admin/invoices/new");
    return (
      <AdminErrorState
        message={clientsResult.message}
        retryHref="/admin/invoices/new"
      />
    );
  }
  if (!projectsResult.ok) {
    if (projectsResult.status === 401) redirect("/login?next=/admin/invoices/new");
    return (
      <AdminErrorState
        message={projectsResult.message}
        retryHref="/admin/invoices/new"
      />
    );
  }

  return (
    <>
      <Link
        href="/admin/invoices"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to invoices
      </Link>

      <AdminPageHeader
        eyebrow="Finance"
        title="New invoice"
        description="Create a draft, then issue it when the details are ready. The invoice number is generated at issue unless you provide one."
      />

      <Card className="p-1">
        <div className="p-4 sm:p-6">
          <InvoiceForm
            clients={clientsResult.data.items}
            projects={projectsResult.data.items}
          />
        </div>
      </Card>
    </>
  );
}
