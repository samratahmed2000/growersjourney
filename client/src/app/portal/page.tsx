import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = {
  title: "Portal dashboard",
  robots: { index: false, follow: false },
};

export default function PortalDashboardPage() {
  return (
    <PlaceholderPage
      area="Client portal"
      title="Portal dashboard"
      description="The client portal is planned for a later task, after authentication is in place. Nothing here is reachable by visitors yet."
    />
  );
}
