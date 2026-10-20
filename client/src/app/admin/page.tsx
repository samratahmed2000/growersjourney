import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = {
  title: "Admin dashboard",
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return (
    <PlaceholderPage
      area="Admin dashboard"
      title="Admin dashboard"
      description="Authentication is now enforced for this area. The dashboard features themselves are planned for a later task, so there is no data or management UI here yet."
    />
  );
}
