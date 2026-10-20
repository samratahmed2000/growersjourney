import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ClientForm } from "@/components/admin/client-form";

export const metadata: Metadata = {
  title: "Add client",
  robots: { index: false, follow: false },
};

export const instant = false;

export default function AdminNewClientPage() {
  return (
    <>
      <Link
        href="/admin/clients"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to clients
      </Link>
      <AdminPageHeader
        eyebrow="Clients"
        title="Add client"
        description="Create a business record. This does not grant portal access or create a login."
      />
      <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <ClientForm mode="create" />
      </div>
    </>
  );
}
