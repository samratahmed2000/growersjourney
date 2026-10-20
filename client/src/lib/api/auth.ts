import { isAppRole, type AppRole } from "@/lib/auth/roles";

/**
 * Browser-side authentication calls.
 *
 * These deliberately talk to Better Auth's own endpoints (`/api/auth/*`) rather
 * than re-implementing password or session logic. The Next.js rewrite forwards
 * the request to the Express-hosted auth handler, so the cookie is set on the
 * site origin and the browser never needs an auth secret or a token in storage.
 *
 * Nothing here writes to localStorage/sessionStorage. The session lives only in
 * the HttpOnly cookie managed by the browser.
 */

export type SignedInUser = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
};

export type SignInFailureKind =
  | "invalid"
  | "rate-limited"
  | "blocked"
  | "timeout"
  | "network"
  | "server";

export type SignInResult =
  | { ok: true; user: SignedInUser }
  | { ok: false; kind: SignInFailureKind; message: string };

export type SignOutResult =
  | { ok: true }
  | { ok: false; message: string };

const SIGN_IN_PATH = "/api/auth/sign-in/email";
const SIGN_OUT_PATH = "/api/auth/sign-out";
const TIMEOUT_MS = 10_000;

const MESSAGES = {
  invalid: "The email or password is incorrect.",
  rateLimited:
    "Too many sign-in attempts. Please wait a minute and try again.",
  blocked:
    "This sign-in request was blocked for security reasons. Reload the page and try again.",
  timeout: "The server did not respond in time. Please try again.",
  network:
    "We could not reach the server. Check your connection and try again.",
  server: "Something went wrong on our side. Please try again.",
  signOut: "We could not sign you out. Please try again.",
} as const;

function readJson(payload: unknown): Record<string, unknown> | null {
  return payload && typeof payload === "object"
    ? (payload as Record<string, unknown>)
    : null;
}

/** Extract only the safe user fields; ignore any token in the response body. */
function toSignedInUser(payload: unknown): SignedInUser | null {
  const body = readJson(payload);
  const user = readJson(body?.user);

  if (!user || !isAppRole(user.role)) {
    return null;
  }

  if (
    typeof user.id !== "string" ||
    typeof user.email !== "string" ||
    typeof user.name !== "string"
  ) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

async function errorCode(response: Response): Promise<string | null> {
  const payload = await response.json().catch(() => null);
  const body = readJson(payload);
  return typeof body?.code === "string" ? body.code : null;
}

export async function signInWithPassword({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<SignInResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(SIGN_IN_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "same-origin",
      signal: controller.signal,
    });

    if (response.ok) {
      const payload = await response.json().catch(() => null);
      const user = toSignedInUser(payload);

      if (!user) {
        // A session may have been created, but the response was not one we can
        // safely navigate with. Do not guess a role.
        return { ok: false, kind: "server", message: MESSAGES.server };
      }

      return { ok: true, user };
    }

    if (response.status === 429) {
      return { ok: false, kind: "rate-limited", message: MESSAGES.rateLimited };
    }

    if (response.status === 403) {
      const code = await errorCode(response);
      return {
        ok: false,
        kind: "blocked",
        message:
          code === "INVALID_ORIGIN" ? MESSAGES.blocked : MESSAGES.invalid,
      };
    }

    if (response.status === 401 || response.status === 400) {
      // Better Auth deliberately does not reveal whether the email exists.
      // Keep the same generic wording in the UI.
      return { ok: false, kind: "invalid", message: MESSAGES.invalid };
    }

    return { ok: false, kind: "server", message: MESSAGES.server };
  } catch (error) {
    const name = (error as { name?: string } | null)?.name;
    return name === "AbortError"
      ? { ok: false, kind: "timeout", message: MESSAGES.timeout }
      : { ok: false, kind: "network", message: MESSAGES.network };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Revoke the current session.
 *
 * A 401 means there was no valid session left; that is treated as success,
 * because the user's desired end state (signed out) is already true.
 */
export async function signOut(): Promise<SignOutResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(SIGN_OUT_PATH, {
      method: "POST",
      credentials: "same-origin",
      signal: controller.signal,
    });

    if (response.ok || response.status === 401) {
      return { ok: true };
    }

    return { ok: false, message: MESSAGES.signOut };
  } catch (error) {
    const name = (error as { name?: string } | null)?.name;
    return {
      ok: false,
      message: name === "AbortError" ? MESSAGES.timeout : MESSAGES.signOut,
    };
  } finally {
    clearTimeout(timeout);
  }
}
