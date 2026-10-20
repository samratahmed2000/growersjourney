import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminErrorState } from "@/components/admin/error-state";
import { InvoiceForm } from "@/components/admin/invoice-form";
import { Card } from "@/components/ui/card";
import { adminGet } from "@/lib/api/admin.server";
import type {
  ClientSummary,
  InvoiceDetail,
  ProjectSummary,
} from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Edit invoice",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoicePath = `/admin/invoices/${encodeURIComponent(id)}`;

  const [invoiceResult, clientsResult, projectsResult] = await Promise.all([
    adminGet<{ invoice: InvoiceDetail }>(
      `/admin/invoices/${encodeURIComponent(id)}`,
    ),
    adminGet<{ items: ClientSummary[] }>(
      "/admin/clients?limit=100&sort=displayName&order=asc",
    ),
    adminGet<{ items: ProjectSummary[] }>(
      "/admin/projects?limit=100&sort=name&order=asc",
    ),
  ]);

  if (!invoiceResult.ok) {
    if (invoiceResult.status === 401) {
      redirect(`/login?next=${encodeURIComponent(`${invoicePath}/edit`)}`);
    }
    if (invoiceResult.status === 404 || invoiceResult.status === 400) notFound();
    return (
      <AdminErrorState message={invoiceResult.message} retryHref={invoicePath} />
    );
  }

  if (invoiceResult.data.invoice.status !== "DRAFT") {
    redirect(invoicePath);
  }

  if (!clientsResult.ok || !projectsResult.ok) {
    return (
      <AdminErrorState
        message={
          clientsResult.ok
            ? !projectsResult.ok
              ? projectsResult.message
              : "The invoice form could not be loaded."
            : clientsResult.message
        }
        retryHref={`${invoicePath}/edit`}
      />
    );
  }

  return (
    <>
      <Link
        href={invoicePath}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to invoice
      </Link>

      <AdminPageHeader
        eyebrow="Finance"
        title={`Edit ${invoiceResult.data.invoice.invoiceNumber ?? "draft invoice"}`}
        description="Only draft invoices can be edited. Issued invoices are immutable; use a refund or void workflow instead."
      />

      <Card className="p-1">
        <div className="p-4 sm:p-6">
          <InvoiceForm
            invoice={invoiceResult.data.invoice}
            clients={clientsResult.data.items}
            projects={projectsResult.data.items}
          />
        </div>
      </Card>
    </>
  );
}
