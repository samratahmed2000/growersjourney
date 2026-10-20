import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, Inbox, ShieldAlert } from "lucide-react";

export function PortalErrorState({
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

export function PortalAccessState() {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
      <ShieldAlert aria-hidden="true" className="size-8" />
      <h1 className="mt-4 text-xl font-semibold">Portal access is not linked</h1>
      <p className="mt-2 text-sm leading-6">
        Your account is signed in, but it is not linked to an active client
        record. This is deliberate: a matching email address never grants
        access on its own.
      </p>
      <p className="mt-3 text-sm leading-6">
        Please contact Growers Journy and ask an administrator to link your
        account from the client record.
      </p>
    </div>
  );
}

export function PortalEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <Inbox aria-hidden="true" className="mx-auto size-8 text-muted" />
      <h2 className="mt-3 text-base font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">
        {description}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function PortalForbiddenState({ status }: { status: number }) {
  if (status === 403) return <PortalAccessState />;
  return <PortalErrorState message="You do not have access to this page." />;
}
