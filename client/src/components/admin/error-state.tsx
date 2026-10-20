import Link from "next/link";
import { AlertCircle } from "lucide-react";

export function AdminErrorState({
  message,
  retryHref,
}: {
  message: string;
  retryHref?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900"
    >
      <div className="flex gap-3">
        <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <h2 className="font-semibold">This page could not load</h2>
          <p className="mt-1 text-sm leading-6">{message}</p>
          {retryHref ? (
            <Link
              href={retryHref}
              className="mt-3 inline-block text-sm font-semibold underline underline-offset-4"
            >
              Try again
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
