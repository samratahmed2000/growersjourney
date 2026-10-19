import type { ReactNode } from "react";

/**
 * Client portal shell.
 *
 * Intentionally minimal: authentication and authorization do not exist yet, so
 * there is nothing safe to show here. The real portal is a later task.
 */
export default function PortalLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-canvas">{children}</div>;
}
