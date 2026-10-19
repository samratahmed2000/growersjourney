import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <PlaceholderPage
      area="Authentication"
      title="Sign in"
      description="Sign-in is planned for a later task. No authentication is implemented, so there is no form to submit here yet."
    />
  );
}
