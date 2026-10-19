import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Wordmark } from "@/components/layout/wordmark";
import { FOOTER_NAV, SITE } from "@/lib/content/site";

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Use", href: "/terms" },
];

export function SiteFooter() {
  return (
    <footer className="bg-brand-950 text-white">
      <Container className="py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1.1fr_1.3fr]">
          <div>
            <Link href="/" aria-label="Growers Journy — home" className="rounded-md">
              <Wordmark variant="light" />
            </Link>
            <p className="mt-4 max-w-xs text-sm font-medium text-white/80">
              {SITE.tagline}
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/55">
              {SITE.description}
            </p>
          </div>

          {FOOTER_NAV.map((group) => (
            <nav key={group.title} aria-labelledby={`footer-${group.title}`}>
              <h2
                id={`footer-${group.title}`}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55"
              >
                {group.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              Contact
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a
                  href={`mailto:${SITE.contact.email}`}
                  className="flex items-start gap-2 text-sm text-white/70 transition-colors hover:text-white"
                >
                  <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span className="break-all">{SITE.contact.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${SITE.contact.phone}`}
                  className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
                >
                  <Phone aria-hidden="true" className="size-4 shrink-0" />
                  {SITE.contact.phoneDisplay}
                </a>
              </li>
            </ul>
            <Link
              href="/contact"
              className="mt-4 inline-block text-sm font-medium text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white"
            >
              How to get in touch
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {SITE.copyrightYear} {SITE.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
