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
      description="Authentication is now enforced for this area. The portal features themselves are planned for a later task, so there is no project or invoice data here yet."
    />
  );
}
