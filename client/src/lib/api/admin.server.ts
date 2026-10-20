import { cookies } from "next/headers";
import type { Pagination } from "../admin/types";

/**
 * Server-only admin API helper.
 *
 * The Next server forwards the browser's session cookie to Express. The cookie
 * is never logged, stored, or returned to a Client Component.
 */
export type AdminGetResult<T> =
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

export async function adminGet<T>(path: string): Promise<AdminGetResult<T>> {
  const base = baseUrl();
  if (!base) {
    return {
      ok: false,
      status: 500,
      code: "CONFIG",
      message: "The admin API is not configured.",
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
          "The admin API could not complete this request.",
      };
    }

    return {
      ok: true,
      data: json?.data as T,
      pagination: json?.pagination as Pagination | undefined,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      code: "NETWORK",
      message: "The admin API could not be reached. Please try again.",
    };
  }
}
