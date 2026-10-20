import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PortfolioForm } from "@/components/admin/portfolio-form";

export const metadata: Metadata = {
  title: "Add portfolio entry",
  robots: { index: false, follow: false },
};

export const instant = false;

export default function AdminNewPortfolioPage() {
  return (
    <>
      <Link
        href="/admin/portfolio"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to portfolio
      </Link>
      <AdminPageHeader
        eyebrow="Portfolio"
        title="Add portfolio entry"
        description="Record only what is real and approved. Mark concept work as a sample."
      />
      <PortfolioForm mode="create" />
    </>
  );
}
