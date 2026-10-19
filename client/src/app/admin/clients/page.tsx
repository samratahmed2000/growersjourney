import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = {
  title: "Clients",
  robots: { index: false, follow: false },
};

export default function AdminClientsPage() {
  return <PlaceholderPage area="Admin clients" title="Clients" />;
}
