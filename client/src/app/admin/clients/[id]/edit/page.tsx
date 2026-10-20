import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminErrorState } from "@/components/admin/error-state";
import { ClientForm } from "@/components/admin/client-form";
import { adminGet } from "@/lib/api/admin.server";
import type { ClientDetail } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Edit client",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminEditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await adminGet<{ client: ClientDetail }>(
    `/admin/clients/${encodeURIComponent(id)}`,
  );

  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/login?next=${encodeURIComponent(`/admin/clients/${id}/edit`)}`);
    }
    if (result.status === 404 || result.status === 400) notFound();
    return (
      <AdminErrorState
        message={result.message}
        retryHref={`/admin/clients/${id}/edit`}
      />
    );
  }

  const client = result.data.client;

  return (
    <>
      <Link
        href={`/admin/clients/${client.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to client
      </Link>
      <AdminPageHeader
        eyebrow="Clients"
        title="Edit client"
        description={client.displayName}
      />
      <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <ClientForm mode="edit" client={client} />
      </div>
    </>
  );
}
