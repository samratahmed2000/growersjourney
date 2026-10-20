/**
 * Safe, provider-independent payment error.
 *
 * Provider adapters throw this for expected failures (bad signature, invalid
 * event payload, unavailable checkout). The payment service maps it to a safe
 * HttpError and never exposes the provider's raw response.
 */
export class PaymentProviderError extends Error {
  constructor(code, message = "The payment provider could not complete the request.") {
    super(message);
    this.name = "PaymentProviderError";
    this.code = code;
    this.isOperational = true;
  }
}

export default PaymentProviderError;
