"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/** Re-run the server-side session check without a full browser reload. */
export function RetryButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "Checking…" : "Try again"}
    </Button>
  );
}
