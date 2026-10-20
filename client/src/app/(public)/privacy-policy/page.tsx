import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { LEGAL_LAST_UPDATED, privacySections } from "@/lib/content/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Growers Journy handles information collected through this website. Draft template pending legal review.",
  alternates: { canonical: "/privacy-policy" },
  // This is a reviewed-template placeholder, not final legal advice. Keep it
  // out of search indexes until the owner confirms the jurisdiction-specific
  // content and removes the draft banner.
  robots: { index: false, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="What this website collects, why, and what choices you have. This is a working draft and is marked as such until it has been reviewed."
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={privacySections}
    />
  );
}
