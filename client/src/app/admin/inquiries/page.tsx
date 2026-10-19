import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = {
  title: "Inquiries",
  robots: { index: false, follow: false },
};

export default function AdminInquiriesPage() {
  return <PlaceholderPage area="Admin inquiries" title="Inquiries" />;
}
