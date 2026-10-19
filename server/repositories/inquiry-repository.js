import { INITIAL_INQUIRY_STATUS } from "../constants/inquiry.js";
import { Inquiry } from "../models/inquiry.js";

/**
 * The only module that writes inquiries.
 *
 * Why a repository instead of calling the model from the route:
 * - The route stays about HTTP (validate, decide, respond) and never imports
 *   Mongoose.
 * - Tests can inject a fake implementation, so the whole endpoint (including
 *   database-failure behaviour) is testable without a MongoDB connection. That
 *   matches the existing DB-free test setup.
 * - The initial status is forced here as well as in the model and the route.
 *   A request body can never reach this function with a different status,
 *   because the validator rejects the field first.
 */

/**
 * @param {object} data Validated, normalized inquiry fields (never `status`).
 * @returns {Promise<{ id: string }>}
 */
export async function createInquiry(data) {
  const document = await Inquiry.create({
    ...data,
    status: INITIAL_INQUIRY_STATUS,
  });

  return { id: String(document._id) };
}

export const inquiryRepository = Object.freeze({ create: createInquiry });

export default inquiryRepository;
