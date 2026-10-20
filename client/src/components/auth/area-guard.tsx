import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentSession } from "@/lib/auth/session";
import {
  areaPath,
  isAdminRole,
  isClientRole,
  type AuthArea,
} from "@/lib/auth/roles";
import { AccessDenied, AuthError } from "./auth-states";
import { AreaShell } from "./area-shell";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Server-side navigation guard for /admin and /portal.
 *
 * This is a usability boundary, not the security boundary. It calls the Express
 * API, which validates the session independently. Even if this component were
 * bypassed, every protected API request would still be rejected without a valid
 * session and role.
 *
 * It reads cookies, so with Cache Components enabled it must either render under
 * a Suspense boundary or the layout must opt into blocking with `instant =
 * false` (which is what the admin and portal layouts do). Allowing the guard to
 * block means the redirect is decided during the server render rather than
 * after a streamed shell.
 */
export async function AreaGuard({
  area,
  children,
}: {
  area: AuthArea;
  children: ReactNode;
}) {
  const session = await getCurrentSession();

  if (session.status === "unauthenticated") {
    redirect(`/login?next=${encodeURIComponent(areaPath(area))}`);
  }

  if (session.status === "forbidden") {
    return <AccessDenied area={area} />;
  }

  if (session.status === "error") {
    return <AuthError message={session.message} />;
  }

  const allowed =
    area === "admin"
      ? isAdminRole(session.user.role)
      : isClientRole(session.user.role);

  if (!allowed) {
    return <AccessDenied area={area} user={session.user} />;
  }

  if (area === "admin") {
    return <AdminShell user={session.user}>{children}</AdminShell>;
  }

  return (
    <AreaShell area={area} user={session.user}>
      {children}
    </AreaShell>
  );
}
