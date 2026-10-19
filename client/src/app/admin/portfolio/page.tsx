import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = {
  title: "Portfolio",
  robots: { index: false, follow: false },
};

export default function AdminPortfolioPage() {
  return (
    <PlaceholderPage
      area="Admin portfolio"
      title="Portfolio"
      description="Portfolio management is planned for a later task. Until then, public project content lives in one content module and is labelled as sample data."
    />
  );
}
