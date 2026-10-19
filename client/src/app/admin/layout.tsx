import type { ReactNode } from "react";

/**
 * Admin area shell.
 *
 * Intentionally minimal: there is no authentication, navigation, or data layer
 * yet, and building them now would mean exposing an unauthenticated admin
 * surface. The real dashboard is a later task.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-canvas">{children}</div>;
}
