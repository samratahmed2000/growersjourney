import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = {
  title: "Services",
  robots: { index: false, follow: false },
};

export default function AdminServicesPage() {
  return <PlaceholderPage area="Admin services" title="Services" />;
}
