import { cookies } from "next/headers";
import type { Pagination } from "../admin/types";

/**
 * Server-only portal API helper.
 *
 * The browser's session cookie is forwarded to Express, which re-validates the
 * session, the CLIENT role, and the explicit client link on every request. The
 * cookie never reaches a Client Component and is never logged.
 */
export type PortalGetResult<T> =
  | { ok: true; data: T; pagination?: Pagination }
  | {
      ok: false;
      status: number;
      code: string;
      message: string;
    };

function baseUrl(): string | null {
  const value = process.env.API_BASE_URL;
  return value ? value.replace(/\/+$/, "") : null;
}

export async function portalGet<T>(path: string): Promise<PortalGetResult<T>> {
  const base = baseUrl();
  if (!base) {
    return {
      ok: false,
      status: 500,
      code: "CONFIG",
      message: "The client portal API is not configured.",
    };
  }

  const cookieStore = await cookies();
  const cookie = cookieStore
    .getAll()
    .map((entry) => `${entry.name}=${entry.value}`)
    .join("; ");

  try {
    const response = await fetch(`${base}${path}`, {
      headers: {
        accept: "application/json",
        ...(cookie ? { cookie } : {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        code: json?.error?.code ?? "ERROR",
        message:
          json?.error?.message ??
          "The client portal could not complete this request.",
      };
    }

    if (json?.success !== true || json.data === undefined || json.data === null) {
      return {
        ok: false,
        status: 502,
        code: "INVALID_RESPONSE",
        message: "The client portal API returned an unexpected response.",
      };
    }

    return {
      ok: true,
      data: json.data as T,
      pagination: json.pagination as Pagination | undefined,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      code: "NETWORK",
      message: "The client portal could not be reached. Please try again.",
    };
  }
}
