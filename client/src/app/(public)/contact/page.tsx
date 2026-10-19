import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { ContactForm } from "@/components/marketing/contact-form";
import { SITE } from "@/lib/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Tell Growers Journy about the project. Email and phone details are published here; the contact form is UI-only until the backend is connected.",
  alternates: { canonical: "/contact" },
};

const HELPFUL_DETAILS = [
  "The problem you want solved, in your own words.",
  "Who will use the system, and roughly how many people.",
  "What happens today — the spreadsheet, the tool, or the manual steps.",
  "Any hard constraints: an existing system, a deadline, or a budget range.",
  "Anything you have already tried, including what did not work.",
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Tell us what you are trying to build"
        description="Rough notes are fine. The most useful thing you can send is an honest description of the problem — the technical details can be worked out together."
      />

      <Section spacing="md">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-ink">
              Project enquiry
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Fields marked with an asterisk are required. The form is not
              connected to the backend yet, so nothing is transmitted or stored —
              the direct contact details are listed alongside.
            </p>

            <div className="mt-8 rounded-2xl border border-line bg-surface p-6 sm:p-8">
              <ContactForm />
            </div>
          </div>

          <aside className="space-y-6 lg:pt-16">
            <div className="rounded-xl border border-line bg-surface p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                Direct contact
              </h2>
              <ul className="mt-4 space-y-3">
                <li>
                  <a
                    href={`mailto:${SITE.contact.email}`}
                    className="flex items-start gap-2.5 text-sm font-medium text-ink transition-colors hover:text-accent-600"
                  >
                    <Mail
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-accent-600"
                    />
                    <span className="break-all">{SITE.contact.email}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${SITE.contact.phone}`}
                    className="flex items-center gap-2.5 text-sm font-medium text-ink transition-colors hover:text-accent-600"
                  >
                    <Phone
                      aria-hidden="true"
                      className="size-4 shrink-0 text-accent-600"
                    />
                    {SITE.contact.phoneDisplay}
                  </a>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-line bg-surface p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                Helpful to include
              </h2>
              <ul className="mt-4 space-y-2.5">
                {HELPFUL_DETAILS.map((detail) => (
                  <li
                    key={detail}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-muted"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1 shrink-0 rounded-full bg-accent-500"
                    />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-line bg-surface p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                Your information
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Nothing entered in the form is stored while the form is
                disconnected. Once it is connected to the backend, the{" "}
                <Link
                  href="/privacy-policy"
                  className="font-medium text-accent-600 underline decoration-accent-500/40 underline-offset-4 transition-colors hover:text-brand-900"
                >
                  privacy policy
                </Link>{" "}
                will be updated first to describe exactly what is collected and
                why.
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
