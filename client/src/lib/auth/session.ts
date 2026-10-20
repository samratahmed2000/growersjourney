import { cookies } from "next/headers";
import {
  isAppRole,
  type AppRole,
  type SessionUser,
} from "@/lib/auth/roles";

/**
 * Server-side session lookup for protected layouts.
 *
 * This is a Data Access Layer helper: it reads the browser's cookie, forwards it
 * to the Express API, and lets the API — which owns the Better Auth instance and
 * the database — decide whether the session is valid. Next.js never verifies a
 * signature or invents a user. A forged cookie simply comes back as 401.
 *
 * Why call the API instead of importing Better Auth here:
 * - Better Auth and the MongoDB adapter live in the Express server. Importing
 *   them into Next would create a second auth instance and a second database
 *   connection, and the two could disagree.
 * - The same `/auth/me` endpoint is what any future client uses. There is one
 *   trusted session-validation path.
 *
 * The cookie value is never logged and never reaches a Client Component.
 */

export type SessionState =
  | { status: "authenticated"; user: SessionUser }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "error"; message: string };

const TIMEOUT_MS = 5000;

const UNAVAILABLE_MESSAGE =
  "We could not verify your session because the account service is unavailable. Please try again in a moment.";

function getApiBaseUrl(): string | null {
  const value = process.env.API_BASE_URL;

  if (!value) {
    return null;
  }

  return value.replace(/\/+$/, "");
}

function readUser(payload: unknown): SessionUser | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== "object") {
    return null;
  }

  const user = (data as { user?: unknown }).user;
  if (!user || typeof user !== "object") {
    return null;
  }

  const candidate = user as Record<string, unknown>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.email !== "string" ||
    typeof candidate.name !== "string" ||
    !isAppRole(candidate.role)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    email: candidate.email,
    name: candidate.name,
    role: candidate.role,
  };
}

export async function getCurrentSession(): Promise<SessionState> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  if (!cookieHeader) {
    return { status: "unauthenticated" };
  }

  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    return {
      status: "error",
      message:
        "The account service is not configured. Set API_BASE_URL for the frontend server.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/auth/me`, {
      cache: "no-store",
      headers: {
        accept: "application/json",
        cookie: cookieHeader,
      },
      signal: controller.signal,
    });

    if (response.status === 401) {
      return { status: "unauthenticated" };
    }

    if (response.status === 403) {
      // Authenticated but the account has no recognised application role.
      return { status: "forbidden" };
    }

    if (!response.ok) {
      return { status: "error", message: UNAVAILABLE_MESSAGE };
    }

    const payload = await response.json().catch(() => null);
    const user = readUser(payload);

    if (!user) {
      // The API answered but not in the expected shape. Do not fall back to a
      // guessed role or treat it as signed in.
      return { status: "error", message: UNAVAILABLE_MESSAGE };
    }

    return { status: "authenticated", user };
  } catch {
    return { status: "error", message: UNAVAILABLE_MESSAGE };
  } finally {
    clearTimeout(timeout);
  }
}

export type { AppRole, SessionUser };
