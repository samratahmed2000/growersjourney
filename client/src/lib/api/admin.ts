/**
 * Browser-side admin mutation helper.
 *
 * Every request is same-origin (`/api/v1/admin/...`). Next rewrites it to
 * Express, which keeps the HttpOnly session cookie on the site origin and lets
 * the API validate the browser's Origin header for writes.
 */
export type AdminFieldErrors = Record<string, string>;

export type AdminMutationResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      status: number;
      code: string;
      message: string;
      fieldErrors: AdminFieldErrors;
    };

function mapFieldErrors(details: unknown): AdminFieldErrors {
  if (!Array.isArray(details)) return {};

  const errors: AdminFieldErrors = {};
  for (const detail of details) {
    if (typeof detail?.field !== "string" || typeof detail?.message !== "string") {
      continue;
    }
    const field = detail.field.replace(/^body\./, "").replace(/^query\./, "");
    if (!errors[field]) errors[field] = detail.message;
  }
  return errors;
}

export async function adminMutate<T>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<AdminMutationResult<T>> {
  try {
    const response = await fetch(`/api/v1/admin${path}`, {
      method,
      credentials: "same-origin",
      headers: {
        accept: "application/json",
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        code: json?.error?.code ?? "ERROR",
        message:
          json?.error?.message ??
          "The request could not be completed. Please try again.",
        fieldErrors: mapFieldErrors(json?.error?.details),
      };
    }

    return { ok: true, data: json?.data as T };
  } catch {
    return {
      ok: false,
      status: 0,
      code: "NETWORK",
      message: "The server could not be reached. Please try again.",
      fieldErrors: {},
    };
  }
}
