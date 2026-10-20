import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Wordmark } from "@/components/layout/wordmark";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the Growers Journy admin area or client portal.",
  robots: { index: false, follow: false },
};

/**
 * `instant = false` lets the page read `searchParams` and still render the full
 * form on the server. The two values are only hints: `next` is re-validated
 * after sign-in, and `signedOut` only toggles a notice.
 */
export const instant = false;

type LoginSearchParams = {
  next?: string | string[];
  signedOut?: string | string[];
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : null;
  const signedOut = params.signedOut === "1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-5 py-16">
      <div className="w-full max-w-[440px]">
        <Link
          href="/"
          className="inline-flex rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
          aria-label="Growers Journy home"
        >
          <Wordmark />
        </Link>

        <div className="mt-8 rounded-xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Sign in
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Access the Growers Journy admin area or client portal. Your role
            decides which area opens.
          </p>

          <div className="mt-6">
            <LoginForm next={next} signedOut={signedOut} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted">
          Growers Journy — Build Smarter. Grow Faster.
        </p>
      </div>
    </main>
  );
}
