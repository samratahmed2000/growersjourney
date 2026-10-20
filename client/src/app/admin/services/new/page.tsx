import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ServiceForm } from "@/components/admin/service-form";

export const metadata: Metadata = {
  title: "Add service",
  robots: { index: false, follow: false },
};

export const instant = false;

export default function AdminNewServicePage() {
  return (
    <>
      <Link
        href="/admin/services"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to services
      </Link>
      <AdminPageHeader
        eyebrow="Services"
        title="Add service"
        description="Create a service record. The slug is permanent after creation."
      />
      <ServiceForm mode="create" />
    </>
  );
}
