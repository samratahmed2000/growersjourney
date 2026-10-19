import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = {
  title: "Projects",
  robots: { index: false, follow: false },
};

export default function AdminProjectsPage() {
  return <PlaceholderPage area="Admin projects" title="Projects" />;
}
