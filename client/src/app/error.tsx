"use client";

import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import { Wordmark } from "@/components/layout/wordmark";

/**
 * Global error boundary.
 *
 * Next.js requires this file to be a Client Component, which is why it starts
 * with the "use client" directive. Without it, the whole app fails to render.
 *
 * Security note: `error.message` and `error.digest` are intentionally NOT
 * rendered. Error messages can contain internal details, so the visitor only
 * ever sees a safe, generic message. Diagnostics belong in the server logs.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <div className="mx-auto flex w-full max-w-[1200px] items-center px-5 py-6 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Growers Journy — home" className="rounded-md">
          <Wordmark />
        </Link>
      </div>

      <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center px-5 pb-20 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-600">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          This page could not be loaded
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          An unexpected error occurred while rendering this page. Trying again
          often resolves it; if it keeps happening, please get in touch and
          describe what you were doing.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => reset()} size="lg">
            Try again
          </Button>
          <ButtonLink href="/" size="lg" variant="secondary">
            Back to homepage
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}
