/**
 * Browser-side client portal mutation helper.
 *
 * Calls are same-origin and rely on the HttpOnly session cookie. The API
 * resolves the linked client from the session; no client id or payment status
 * is ever accepted from this helper.
 */
export type PortalFieldErrors = Record<string, string>;

export type PortalMutationResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      status: number;
      code: string;
      message: string;
      fieldErrors: PortalFieldErrors;
    };

function mapFieldErrors(details: unknown): PortalFieldErrors {
  if (!Array.isArray(details)) return {};
  const errors: PortalFieldErrors = {};
  for (const detail of details) {
    if (typeof detail?.field !== "string" || typeof detail?.message !== "string") {
      continue;
    }
    const field = detail.field.replace(/^body\./, "").replace(/^query\./, "");
    if (!errors[field]) errors[field] = detail.message;
  }
  return errors;
}

export async function portalMutate<T>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<PortalMutationResult<T>> {
  try {
    const response = await fetch(`/api/v1/portal${path}`, {
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
