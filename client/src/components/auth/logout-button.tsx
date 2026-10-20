"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/api/auth";

/**
 * Sign-out control used in the authenticated area headers.
 *
 * It calls Better Auth's own sign-out endpoint, which revokes the session row in
 * MongoDB and expires the cookie. The redirect only happens after the server
 * confirms the revocation; a failed request keeps the user where they are and
 * explains what happened.
 */
export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (pending) {
      return;
    }

    setPending(true);
    setError(null);

    const result = await signOut();

    if (!result.ok) {
      setError(result.message);
      setPending(false);
      return;
    }

    router.replace("/login?signedOut=1");
    router.refresh();
  }

  return (
    <div className={className}>
      <Button
        variant="secondary"
        onClick={() => void handleClick()}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Signing out…" : "Sign out"}
      </Button>

      {error ? (
        <p role="alert" className="mt-1 max-w-[260px] text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
