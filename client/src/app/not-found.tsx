import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Wordmark } from "@/components/layout/wordmark";

const USEFUL_LINKS = [
  { label: "Services", href: "/services" },
  { label: "Our Work", href: "/work" },
  { label: "About", href: "/about" },
  { label: "Process", href: "/process" },
  { label: "Contact", href: "/contact" },
];

/**
 * Global 404 page.
 *
 * This file must always export a component: an empty one breaks 404 handling
 * for the whole application. It renders inside the root layout only, so it
 * includes its own minimal shell rather than the public header and footer.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <div className="mx-auto flex w-full max-w-[1200px] items-center px-5 py-6 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Growers Journy — home" className="rounded-md">
          <Wordmark />
        </Link>
      </div>

      <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center px-5 pb-20 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-600">
          Error 404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          We could not find that page
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          The link may be out of date, or the page may have moved. These pages
          are a good place to start instead.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/" size="lg">
            Back to homepage
          </ButtonLink>
          <ButtonLink href="/contact" size="lg" variant="secondary">
            Contact us
          </ButtonLink>
        </div>

        <nav aria-label="Useful pages" className="mt-10 border-t border-line pt-6">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {USEFUL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-medium text-muted transition-colors hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </div>
  );
}
