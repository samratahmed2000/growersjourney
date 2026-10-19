import { z } from "zod";
import { INQUIRY_LIMITS, INQUIRY_SERVICES } from "../constants/inquiry.js";

/**
 * Public validation schema for POST /api/v1/inquiries.
 *
 * Rules:
 * - The object is STRICT. Unknown keys are rejected with 400 instead of being
 *   silently dropped. That is what makes an attempt to submit `status`,
 *   `notes`, `assignedTo`, `_id`, or any other internal field fail loudly and
 *   visibly, rather than appearing to succeed.
 * - `website` is the one declared exception: it is a honeypot, not user data.
 * - Email is trimmed and lower-cased, so the same person is stored consistently.
 * - URLs are normalized to a canonical http(s) form. Other protocols are
 *   rejected; they are never fetched by this server, but they must never be
 *   stored for an admin UI to render later.
 * - Every string is length-bounded here and again in the Mongoose model.
 */

const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Normalize a reference link.
 *
 * Returns:
 * - `undefined` when the field was empty (it is optional),
 * - a canonical `https://...` / `http://...` string when valid,
 * - `null` when the value is not an acceptable web URL.
 *
 * A missing scheme is upgraded to https, so "example.com" becomes
 * "https://example.com/". Embedded credentials (user:pass@host) are rejected:
 * storing them would put a password in the database and in admin pages.
 *
 * @param {unknown} raw
 * @returns {string | undefined | null}
 */
export function normalizeReferenceUrl(raw) {
  if (typeof raw !== "string") {
    return undefined;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }

  const candidate = SCHEME_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }
  if (!url.hostname) {
    return null;
  }
  if (url.username || url.password) {
    return null;
  }
  if (url.href.length > INQUIRY_LIMITS.referenceUrl.max) {
    return null;
  }

  return url.href;
}

/** Optional text: trimmed, bounded, and stored as absent when empty. */
function optionalText(maxLength) {
  return z
    .string()
    .trim()
    .max(maxLength, `Please use ${maxLength} characters or fewer.`)
    .optional()
    .transform((value) => (value === undefined || value === "" ? undefined : value));
}

const referenceUrlSchema = z
  .string()
  .trim()
  .max(
    INQUIRY_LIMITS.referenceUrl.max,
    `Please use a link of ${INQUIRY_LIMITS.referenceUrl.max} characters or fewer.`,
  )
  .optional()
  .transform((value) => normalizeReferenceUrl(value))
  .refine((value) => value !== null, {
    message: "Please enter a valid http:// or https:// link.",
  })
  .transform((value) => value ?? undefined);

export const createInquirySchema = z.strictObject({
  name: z
    .string({ error: "Please enter your name." })
    .trim()
    .min(INQUIRY_LIMITS.name.min, "Please enter your name.")
    .max(
      INQUIRY_LIMITS.name.max,
      `Please use ${INQUIRY_LIMITS.name.max} characters or fewer.`,
    ),

  email: z
    .string({ error: "Please enter an email address." })
    .trim()
    .toLowerCase()
    .max(INQUIRY_LIMITS.email.max, "Please use a shorter email address.")
    .pipe(z.email({ error: "Please enter a valid email address." })),

  company: optionalText(INQUIRY_LIMITS.company.max),

  service: z.enum(INQUIRY_SERVICES, {
    error: "Please choose a service, or select “Not sure yet”.",
  }),

  projectDescription: z
    .string({ error: "Please describe the project." })
    .trim()
    .min(
      INQUIRY_LIMITS.projectDescription.min,
      "Please describe the project in at least a sentence or two.",
    )
    .max(
      INQUIRY_LIMITS.projectDescription.max,
      `Please use ${INQUIRY_LIMITS.projectDescription.max} characters or fewer.`,
    ),

  budget: optionalText(INQUIRY_LIMITS.budget.max),
  timeline: optionalText(INQUIRY_LIMITS.timeline.max),
  referenceUrl: referenceUrlSchema,

  /**
   * Honeypot. A human never sees it. It is declared so the strict object does
   * not reject a bot that fills it; the route decides what to do with it.
   */
  website: z.string().max(INQUIRY_LIMITS.website.max).optional(),
});

export default createInquirySchema;
