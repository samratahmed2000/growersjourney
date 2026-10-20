import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminErrorState } from "@/components/admin/error-state";
import { ServiceForm } from "@/components/admin/service-form";
import { adminGet } from "@/lib/api/admin.server";
import type { Service } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Edit service",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminEditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await adminGet<{ service: Service }>(
    `/admin/services/${encodeURIComponent(id)}`,
  );

  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/login?next=${encodeURIComponent(`/admin/services/${id}/edit`)}`);
    }
    if (result.status === 404 || result.status === 400) notFound();
    return (
      <AdminErrorState
        message={result.message}
        retryHref={`/admin/services/${id}/edit`}
      />
    );
  }

  const service = result.data.service;

  return (
    <>
      <Link
        href={`/admin/services/${service.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to service
      </Link>
      <AdminPageHeader
        eyebrow="Services"
        title="Edit service"
        description={service.title}
      />
      <ServiceForm mode="edit" service={service} />
    </>
  );
}
