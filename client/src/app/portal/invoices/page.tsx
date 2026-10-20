import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = {
  title: "Your invoices",
  robots: { index: false, follow: false },
};

export default function PortalInvoicesPage() {
  return (
    <PlaceholderPage
      area="Client portal invoices"
      title="Your invoices"
      description="Invoice viewing and payment history are not part of this release. Payment state will always be verified on the server, never inferred from a browser redirect."
    />
  );
}
