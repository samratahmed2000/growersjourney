import { z } from "zod";

const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Normalize an admin-supplied web URL.
 *
 * Returns `undefined` for an empty optional field, a canonical http(s) URL for
 * a valid value, or `null` for a value that must be rejected. Embedded
 * credentials are rejected so a password is never stored in content.
 */
export function normalizeHttpUrl(raw, maxLength = 2048) {
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
  if (!url.hostname || url.username || url.password) {
    return null;
  }
  if (url.href.length > maxLength) {
    return null;
  }

  return url.href;
}

export function optionalUrlSchema(maxLength = 2048) {
  return z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform((value) => normalizeHttpUrl(value, maxLength))
    .refine((value) => value !== null, {
      message: "Please enter a valid http:// or https:// link.",
    })
    .transform((value) => value ?? undefined);
}
