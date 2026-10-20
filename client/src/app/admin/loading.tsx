import { AuthChecking } from "@/components/auth/auth-states";

/**
 * Route-level loading state for the admin area.
 *
 * The guard re-validates the session with the API on each server render. This
 * fallback makes that wait explicit instead of showing a blank shell. It is not
 * a security boundary; it only describes the state.
 */
export default function AdminLoading() {
  return <AuthChecking area="admin" />;
}
