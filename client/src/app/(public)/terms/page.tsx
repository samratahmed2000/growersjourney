import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { LEGAL_LAST_UPDATED, termsSections } from "@/lib/content/legal";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms that apply to this website, including how portfolio sample content should be read. Draft template pending legal review.",
  alternates: { canonical: "/terms" },
  // Draft legal copy must not be indexed until the owner approves it.
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      description="The ground rules for using this website, including how the concept projects in the portfolio should be read."
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={termsSections}
    />
  );
}
