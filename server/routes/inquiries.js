import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { createRateLimiter, INQUIRY_RATE_LIMIT } from "../middleware/rate-limit.js";
import { inquiryRepository as defaultRepository } from "../repositories/inquiry-repository.js";
import { sendSuccess } from "../utils/api-response.js";
import { INITIAL_INQUIRY_STATUS } from "../constants/inquiry.js";
import { createInquirySchema } from "../validators/inquiry.js";

/**
 * POST /api/v1/inquiries — the only public write endpoint.
 *
 * Order is deliberate:
 *   1. rate limit  — cheap, protects validation and the database from floods
 *   2. validation  — strict schema; unknown/internal fields are rejected
 *   3. honeypot    — silently accept and discard obvious bots
 *   4. persist     — status is forced server-side, never read from the body
 *   5. respond     — a generic message, never the stored record
 *
 * The response deliberately contains no id, email, or description. The visitor
 * already knows what they typed, and a public endpoint should not confirm
 * whether a particular address exists in the database.
 */

export const INQUIRY_RECEIVED_MESSAGE =
  "Thank you — your enquiry has been received.";

/**
 * @param {object} [options]
 * @param {{ create: (data: object) => Promise<unknown> }} [options.repository]
 *   Injectable so tests can run without MongoDB and simulate write failures.
 * @param {{ windowMs?: number, limit?: number }} [options.rateLimit]
 *   Injectable so tests can trigger 429 without sending hundreds of requests.
 */
export function createInquiriesRouter({
  repository = defaultRepository,
  rateLimit: rateLimitOptions = INQUIRY_RATE_LIMIT,
} = {}) {
  const router = Router();
  const limiter = createRateLimiter(rateLimitOptions);

  router.post(
    "/",
    limiter,
    validate({ body: createInquirySchema }),
    async (req, res) => {
      // `website` is the honeypot, not inquiry data. A bot that fills it gets
      // the same 201 as a human, but nothing is written. It is never logged.
      const { website, ...inquiry } = req.validated.body;
      const looksAutomated = typeof website === "string" && website.trim() !== "";

      if (looksAutomated) {
        sendSuccess(res, { message: INQUIRY_RECEIVED_MESSAGE }, 201);
        return;
      }

      await repository.create({
        ...inquiry,
        status: INITIAL_INQUIRY_STATUS,
      });

      sendSuccess(res, { message: INQUIRY_RECEIVED_MESSAGE }, 201);
    },
  );

  return router;
}

export default createInquiriesRouter;
