"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The API logs the request id and redacted diagnostics. Do not print the
    // error object here: it could contain data meant for server logs only.
    console.error("Admin page render failed");
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-red-900"
    >
      <AlertCircle aria-hidden="true" className="size-8" />
      <h1 className="mt-4 text-xl font-semibold">The admin page could not load</h1>
      <p className="mt-2 text-sm leading-6">
        Something went wrong while rendering this page. No records were changed.
        Try again, or return to the dashboard if the problem continues.
      </p>
      <Button
        onClick={reset}
        className="mt-5 bg-red-700 text-white hover:bg-red-800"
      >
        Try again
      </Button>
    </div>
  );
}
