/**
 * Shared inquiry constants.
 *
 * Why a separate module:
 * - The Mongoose model and the Zod validator both need the status and service
 *   allowlists. Keeping one copy means the database layer and the HTTP layer
 *   cannot drift apart.
 * - `server/` is plain JavaScript and cannot import the TypeScript content
 *   module in `client/`, so the service slugs are duplicated here on purpose.
 *   Keep them in sync with `client/src/lib/content/services.ts`. Adding a
 *   service is a two-file change, and unknown slugs are rejected.
 */

/** Pipeline states. Only staff tooling may change these later; the public API cannot. */
export const INQUIRY_STATUSES = Object.freeze([
  "NEW",
  "REVIEWING",
  "QUALIFIED",
  "CONVERTED",
  "CLOSED",
]);

/**
 * Services a visitor may ask about.
 *
 * `not-sure` is an explicit answer, not a missing value: the form requires a
 * choice and "Not sure yet" is a legitimate one.
 */
export const INQUIRY_SERVICES = Object.freeze([
  "web-application-development",
  "business-automation",
  "ai-integration",
  "not-sure",
]);

/**
 * Length limits, used by both the validator and the model (defence in depth).
 * The values are deliberately generous for real enquiries but bounded.
 */
export const INQUIRY_LIMITS = Object.freeze({
  name: { min: 2, max: 100 },
  email: { max: 254 },
  company: { max: 120 },
  projectDescription: { min: 20, max: 5000 },
  budget: { max: 100 },
  timeline: { max: 100 },
  referenceUrl: { max: 2048 },
  /** Honeypot field. No human should ever fill it. */
  website: { max: 200 },
});

/** The only status a public submission may ever have. */
export const INITIAL_INQUIRY_STATUS = "NEW";
