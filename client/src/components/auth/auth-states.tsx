import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, LoaderCircle, ShieldX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Wordmark } from "@/components/layout/wordmark";
import {
  areaLabel,
  areaPath,
  isAdminRole,
  isClientRole,
  roleLabel,
  type AuthArea,
  type SessionUser,
} from "@/lib/auth/roles";
import { LogoutButton } from "./logout-button";
import { RetryButton } from "./retry-button";

/**
 * Full-page states for the authentication boundary.
 *
 * These are server components where possible, so no session data is shipped to
 * the browser beyond the already-authenticated user's display fields.
 */

function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-5 py-16">
      <div className="w-full max-w-[460px]">
        <Link
          href="/"
          className="inline-flex rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
          aria-label="Growers Journy home"
        >
          <Wordmark />
        </Link>

        <div className="mt-8 rounded-xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}

/** Suspense fallback and the visual state while Express validates the cookie. */
export function AuthChecking({ area }: { area: AuthArea }) {
  return (
    <AuthFrame>
      <div role="status" aria-live="polite" className="text-center">
        <LoaderCircle
          aria-hidden="true"
          className="mx-auto size-6 animate-spin text-accent-600"
        />
        <h1 className="mt-4 text-lg font-semibold text-ink">
          Checking your session
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Verifying access to the {areaLabel(area)}. This usually takes a moment.
        </p>
      </div>
    </AuthFrame>
  );
}

/**
 * Shown when the caller is authenticated but their role does not open this area.
 *
 * The link points only to the area their role actually permits. There is no
 * "continue anyway" action, because the API would reject it too.
 */
export function AccessDenied({
  area,
  user,
}: {
  area: AuthArea;
  user?: SessionUser;
}) {
  const correctArea =
    user && isClientRole(user.role) && area === "admin"
      ? "portal"
      : user && isAdminRole(user.role) && area === "portal"
        ? "admin"
        : null;

  return (
    <AuthFrame>
      <div role="alert">
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-red-50 text-red-700">
          <ShieldX aria-hidden="true" className="size-5" />
        </span>

        <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">
          You do not have access to this area
        </h1>

        {user ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            You are signed in as{" "}
            <span className="font-medium text-ink">{user.email}</span> with the{" "}
            {roleLabel(user.role)} role. That role cannot open the{" "}
            {areaLabel(area)}.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Your account is signed in, but it does not have an application role.
            Ask a Growers Journy administrator to assign one.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {correctArea ? (
            <ButtonLink href={areaPath(correctArea)}>
              Go to {areaLabel(correctArea)}
            </ButtonLink>
          ) : null}
          <LogoutButton />
        </div>

        <p className="mt-5 text-xs leading-relaxed text-muted">
          If you believe this is a mistake, contact the Growers Journy
          administrator who created your account.
        </p>
      </div>
    </AuthFrame>
  );
}

/**
 * Shown when the session cannot be checked at all (API down, misconfigured, or
 * an unexpected response). It deliberately does not redirect to /login: that
 * would turn a temporary outage into an apparent sign-out and could loop.
 */
export function AuthError({ message }: { message: string }) {
  return (
    <AuthFrame>
      <div role="alert">
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
          <AlertTriangle aria-hidden="true" className="size-5" />
        </span>

        <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">
          We could not verify your session
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <RetryButton />
          <ButtonLink href="/login" variant="secondary">
            Go to sign in
          </ButtonLink>
        </div>
      </div>
    </AuthFrame>
  );
}
