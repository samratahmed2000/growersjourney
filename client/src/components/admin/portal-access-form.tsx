"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Unlink } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/field-controls";
import { adminMutate } from "@/lib/api/admin";
import { formatDateTime } from "@/lib/admin/format";
import type { ClientDetail, PortalAccess } from "@/lib/admin/types";
import { FormField, fieldDescribedBy } from "./form-field";

export function PortalAccessForm({
  clientId,
  portalAccess,
}: {
  clientId: string;
  portalAccess: PortalAccess | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(portalAccess?.email ?? "");
  const [pending, setPending] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  async function linkAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const result = await adminMutate<{
      client: ClientDetail;
      portalAccess: PortalAccess;
    }>(`/clients/${clientId}/portal-access`, "PATCH", { email });

    if (!result.ok) {
      if (result.status === 401) {
        router.push(
          `/login?next=${encodeURIComponent(`/admin/clients/${clientId}`)}`,
        );
        return;
      }
      setError(result.message);
      setFieldErrors(result.fieldErrors);
      setPending(false);
      return;
    }

    setSuccess(
      result.data.portalAccess.email
        ? `Portal access linked to ${result.data.portalAccess.email}.`
        : "Portal access linked.",
    );
    setPending(false);
    router.refresh();
  }

  async function unlinkAccount() {
    if (pending) return;
    setPending(true);
    setError(null);
    setSuccess(null);

    const result = await adminMutate<{ portalAccess: null }>(
      `/clients/${clientId}/portal-access`,
      "PATCH",
      { email: null },
    );

    if (!result.ok) {
      if (result.status === 401) {
        router.push(
          `/login?next=${encodeURIComponent(`/admin/clients/${clientId}`)}`,
        );
        return;
      }
      setError(result.message);
      setPending(false);
      setConfirmUnlink(false);
      return;
    }

    setEmail("");
    setSuccess("Portal access was unlinked. The account itself was not deleted.");
    setPending(false);
    setConfirmUnlink(false);
    router.refresh();
  }

  return (
    <div>
      {error ? (
        <Alert tone="error" className="mb-3">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert tone="success" className="mb-3">
          {success}
        </Alert>
      ) : null}

      {portalAccess ? (
        <div className="mb-4 rounded-lg border border-line bg-canvas p-3 text-sm">
          {portalAccess.missing ? (
            <Alert tone="warning">
              The linked account no longer exists in the authentication store.
              Link an existing account again, or unlink this stale reference.
            </Alert>
          ) : (
            <>
              <p className="font-medium text-ink">
                Linked to {portalAccess.name ?? "Unnamed account"}
              </p>
              <p className="mt-1 break-all text-muted">
                {portalAccess.email ?? portalAccess.userId}
              </p>
              <p className="mt-1 text-xs text-muted">
                Linked {formatDateTime(portalAccess.linkedAt)}
              </p>
            </>
          )}
        </div>
      ) : (
        <p className="mb-4 text-sm leading-6 text-muted">
          No portal account is linked. The client cannot see projects until an
          administrator links an existing CLIENT account here.
        </p>
      )}

      <form onSubmit={linkAccount} className="space-y-3">
        <FormField
          id="portal-email"
          label="Existing CLIENT account email"
          hint="This looks up an existing account. It never creates or invites one."
          error={fieldErrors.email}
          required
        >
          <Input
            id="portal-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="off"
            required
            aria-describedby={`portal-email-hint${fieldDescribedBy("portal-email", {
              error: fieldErrors.email,
            }) ? ` ${fieldDescribedBy("portal-email", { error: fieldErrors.email })}` : ""}`}
            aria-invalid={Boolean(fieldErrors.email)}
          />
        </FormField>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending} aria-busy={pending}>
            <Link2 aria-hidden="true" className="size-4" />
            {pending ? "Linking…" : portalAccess ? "Relink account" : "Link account"}
          </Button>
          {portalAccess ? (
            <Button
              variant="secondary"
              onClick={() => setConfirmUnlink(true)}
              disabled={pending}
              className="border-red-200 text-red-800 hover:bg-red-50"
            >
              <Unlink aria-hidden="true" className="size-4" />
              Unlink access
            </Button>
          ) : null}
        </div>
      </form>

      <p className="mt-4 border-t border-line pt-3 text-xs leading-5 text-muted">
        An email match at sign-in never grants access. This explicit link, stored
        on the client record, is the only portal-access path.
      </p>

      <ConfirmDialog
        open={confirmUnlink}
        title="Unlink portal access?"
        description="The client will immediately lose access to portal data. The Better Auth account remains, and access can be linked again later."
        confirmLabel="Unlink access"
        pending={pending}
        danger
        onConfirm={() => void unlinkAccount()}
        onCancel={() => setConfirmUnlink(false)}
      />
    </div>
  );
}
