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
      description="The admin dashboard is planned for a later task, after authentication and the data layer exist. It is deliberately not accessible or linked yet."
    />
  );
}
