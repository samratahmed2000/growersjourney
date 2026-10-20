import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  PortalAccessState,
  PortalErrorState,
} from "@/components/portal/states";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { PrintButton } from "@/components/invoices/print-button";
import { portalGet } from "@/lib/api/portal.server";
import type { InvoiceDetail } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Print invoice",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function PortalPrintInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoicePath = `/portal/invoices/${encodeURIComponent(id)}`;
  const result = await portalGet<{ invoice: InvoiceDetail; payments: unknown[] }>(
    invoicePath,
  );

  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/login?next=${encodeURIComponent(`${invoicePath}/print`)}`);
    }
    if (result.status === 403) return <PortalAccessState />;
    if (result.status === 404 || result.status === 400) notFound();
    return (
      <PortalErrorState message={result.message} retryHref={invoicePath} />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={invoicePath}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to invoice
        </Link>
        <PrintButton />
      </div>
      <InvoiceDocument invoice={result.data.invoice} audience="client" />
    </div>
  );
}
