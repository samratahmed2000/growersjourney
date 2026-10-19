/**
 * Minimal server-side API client for the Growers Journy frontend.
 *
 * Design notes:
 * - This file is imported by SERVER components only. It reads `API_BASE_URL`
 *   from the server environment, which keeps the backend address (and any
 *   future backend-only values) out of the browser bundle.
 * - Every call returns a result object instead of throwing, so UI code can
 *   render a clear error state for a network failure, a timeout, or a
 *   non-2xx response.
 */

const DEFAULT_TIMEOUT_MS = 5000;

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function getBaseUrl(): string | null {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    return null;
  }
  // Tolerate a trailing slash so `baseUrl + "/health"` never doubles up.
  return baseUrl.replace(/\/+$/, "");
}

/** Perform a GET request against the backend API. */
export async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  const baseUrl = getBaseUrl();

  if (!baseUrl) {
    return {
      success: false,
      error: {
        code: "CONFIG_ERROR",
        message: "API_BASE_URL is not configured for the server.",
      },
    };
  }

  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });

    // An error body may not be JSON, so never assume it parses.
    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: "HTTP_ERROR",
          message: `The API responded with status ${response.status}.`,
        },
      };
    }

    if (!body || typeof body !== "object" || !("success" in body)) {
      return {
        success: false,
        error: {
          code: "INVALID_RESPONSE",
          message: "The API response did not match the expected format.",
        },
      };
    }

    return body as ApiResult<T>;
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "TimeoutError";

    return {
      success: false,
      error: {
        code: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
        message: isTimeout
          ? "The API did not respond in time."
          : "Could not reach the API. Is the backend running?",
      },
    };
  }
}

export type HealthData = { status: string };

/** Fetch the backend health status (`GET /api/v1/health`). */
export function getHealth(): Promise<ApiResult<HealthData>> {
  return apiGet<HealthData>("/health");
}
