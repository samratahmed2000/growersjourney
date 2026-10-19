import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = {
  title: "Invoices",
  robots: { index: false, follow: false },
};

export default function AdminInvoicesPage() {
  return (
    <PlaceholderPage
      area="Admin invoices"
      title="Invoices"
      description="Invoicing is planned for a later task. Financial values will be calculated and verified on the server, never trusted from the browser."
    />
  );
}
