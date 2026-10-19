/**
 * Browser-side inquiry submission helper.
 *
 * Why this is separate from `src/lib/api/client.ts`:
 * - `client.ts` is server-only and reads `API_BASE_URL`, so the backend address
 *   never reaches the browser.
 * - The contact form runs in the browser, so it needs a public base URL. That
 *   URL is not a secret — it is the address any visitor's browser must reach.
 *   It is configured with `NEXT_PUBLIC_API_BASE_URL` and contains no
 *   credentials.
 *
 * The helper never throws. It returns a discriminated result so the form can
 * render an accurate state without a try/catch around every call.
 */

export type InquiryInput = {
  name: string;
  email: string;
  company?: string;
  service: string;
  projectDescription: string;
  budget?: string;
  timeline?: string;
  referenceUrl?: string;
  /** Honeypot. Always present, always empty for a human. */
  website?: string;
};

export type InquiryFieldErrors = Record<string, string>;

export type SubmitInquiryResult =
  | { ok: true }
  | {
      ok: false;
      kind: "validation";
      message: string;
      fieldErrors: InquiryFieldErrors;
    }
  | { ok: false; kind: "rate-limited"; message: string }
  | { ok: false; kind: "timeout"; message: string }
  | { ok: false; kind: "network"; message: string }
  | { ok: false; kind: "server"; message: string }
  | { ok: false; kind: "config"; message: string };

const TIMEOUT_MS = 10_000;

const MESSAGES = {
  config:
    "The contact form is not configured, so your message was not sent. Please email or call using the details on this page.",
  network:
    "We could not reach the server, so your message was not sent. Check your connection and try again, or email us directly.",
  timeout:
    "The server did not respond in time. Your message may or may not have been received — please email us directly to be sure before sending it again.",
  server:
    "Something went wrong on our side, so your message was not sent. Please try again, or email us directly.",
  tooLarge:
    "Your message is too long to send. Please shorten the project description and try again.",
  rateLimited:
    "Too many enquiries have been sent from this address. Please wait a few minutes and try again, or email us directly.",
} as const;

/**
 * Read `NEXT_PUBLIC_API_BASE_URL`.
 *
 * The property access is written out in full because Next.js replaces it at
 * build time only in that form; destructuring `process.env` would leave it
 * undefined in the browser bundle.
 */
function getBaseUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!value) {
    return null;
  }

  return value.replace(/\/+$/, "");
}

type ErrorDetail = { field?: string; message?: string };

type ErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    details?: ErrorDetail[];
  };
};

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    // A proxy or hosting platform can return HTML. Never let that crash the UI.
    return null;
  }
}

function readErrorEnvelope(payload: unknown): ErrorEnvelope["error"] {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }
  const error = (payload as ErrorEnvelope).error;
  return error && typeof error === "object" ? error : undefined;
}

/** "body.email" → "email"; the form maps the remaining names to its own fields. */
function toFieldErrors(details: ErrorDetail[] | undefined): InquiryFieldErrors {
  const fieldErrors: InquiryFieldErrors = {};

  for (const detail of details ?? []) {
    if (typeof detail?.field !== "string" || typeof detail?.message !== "string") {
      continue;
    }

    const field = detail.field.startsWith("body.")
      ? detail.field.slice("body.".length)
      : detail.field;

    if (!(field in fieldErrors)) {
      fieldErrors[field] = detail.message;
    }
  }

  return fieldErrors;
}

function retryMessage(response: Response): string {
  const raw = response.headers.get("retry-after");

  if (raw) {
    const seconds = Number.parseInt(raw, 10);
    if (Number.isFinite(seconds) && seconds > 0) {
      const minutes = Math.ceil(seconds / 60);
      return `Too many enquiries have been sent from this address. Please try again in about ${minutes} ${
        minutes === 1 ? "minute" : "minutes"
      }, or email us directly.`;
    }
  }

  return MESSAGES.rateLimited;
}

export async function submitInquiry(
  input: InquiryInput,
): Promise<SubmitInquiryResult> {
  const baseUrl = getBaseUrl();

  if (!baseUrl) {
    return { ok: false, kind: "config", message: MESSAGES.config };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
      // The API uses no cookies today; omitting credentials keeps CORS simple
      // and prevents accidental future cookie exposure.
      credentials: "omit",
    });

    if (response.ok) {
      return { ok: true };
    }

    const payload = await readJson(response);
    const error = readErrorEnvelope(payload);

    if (response.status === 400 && error?.code === "VALIDATION_ERROR") {
      return {
        ok: false,
        kind: "validation",
        message: error.message ?? "Please check the information you entered.",
        fieldErrors: toFieldErrors(error.details),
      };
    }

    if (response.status === 413) {
      return { ok: false, kind: "validation", message: MESSAGES.tooLarge, fieldErrors: {} };
    }

    if (response.status === 429) {
      return { ok: false, kind: "rate-limited", message: retryMessage(response) };
    }

    return { ok: false, kind: "server", message: MESSAGES.server };
  } catch (error) {
    const name = (error as { name?: string } | null)?.name;

    if (name === "AbortError") {
      return { ok: false, kind: "timeout", message: MESSAGES.timeout };
    }

    return { ok: false, kind: "network", message: MESSAGES.network };
  } finally {
    clearTimeout(timeout);
  }
}
