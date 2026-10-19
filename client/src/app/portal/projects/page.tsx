import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = {
  title: "Your projects",
  robots: { index: false, follow: false },
};

export default function PortalProjectsPage() {
  return <PlaceholderPage area="Client portal projects" title="Your projects" />;
}
