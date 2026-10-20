import type { ReactNode } from "react";
import { AreaGuard } from "@/components/auth/area-guard";

/**
 * Client portal shell.
 *
 * Only a CLIENT session gets past the guard. Staff are deliberately denied here
 * unless a future feature adds an explicit, audited support-access flow.
 *
 * `instant = false` lets the guard block on the session read so an anonymous
 * visit receives a real redirect to /login. The API remains the actual security
 * boundary. Portal features are a later task.
 */
export const instant = false;

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <AreaGuard area="portal">{children}</AreaGuard>;
}
