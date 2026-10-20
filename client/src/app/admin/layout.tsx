import type { ReactNode } from "react";
import { AreaGuard } from "@/components/auth/area-guard";

/**
 * Admin area shell.
 *
 * `instant = false` opts this route out of instant-navigation validation and
 * allows the guard to block on the session read. That matters for security UX:
 * an anonymous visit gets a real redirect to /login instead of a streamed shell
 * with a client-side redirect. The API remains the actual security boundary.
 *
 * The dashboard features themselves are a later task.
 */
export const instant = false;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AreaGuard area="admin">{children}</AreaGuard>;
}
