import { badRequest } from "../utils/http-error.js";

/**
 * Request validation middleware (Zod).
 *
 * Usage:
 *   router.post("/inquiries", validate({ body: inquirySchema }), controller);
 *
 * Why the parsed result is stored on `req.validated` instead of overwriting
 * `req.body` / `req.query` / `req.params`:
 * in Express 5, `req.query` is a getter-only property, so assigning to it
 * throws. Keeping all validated data in one place also makes it obvious which
 * values have passed validation.
 *
 * Notes:
 * - `details` contains only a field path and the schema's message. The received
 *   value is never echoed back, so sensitive input cannot leak into responses.
 * - Zod object schemas strip unknown keys by default, so unexpected fields are
 *   discarded rather than forwarded to the database layer.
 */
export function validate(schemas = {}) {
  return function validateRequest(req, res, next) {
    const details = [];
    const validated = {};

    for (const target of ["params", "query", "body"]) {
      const schema = schemas[target];
      if (!schema) {
        continue;
      }

      const result = schema.safeParse(req[target] ?? {});

      if (result.success) {
        validated[target] = result.data;
        continue;
      }

      for (const issue of result.error.issues) {
        details.push({
          field: [target, ...issue.path].join("."),
          message: issue.message,
        });
      }
    }

    if (details.length > 0) {
      next(badRequest("Please check the submitted information.", details));
      return;
    }

    req.validated = validated;
    next();
  };
}

export default validate;
