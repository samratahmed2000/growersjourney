import { createFakePaymentProvider } from "./fake-provider.js";

/**
 * Provider-independent payment adapter factory.
 *
 * Only the mock provider is implemented in Task 09 because no merchant account
 * or real provider credentials have been confirmed. Add a real adapter here
 * only after its fee, settlement, refund, and webhook contracts have been
 * reviewed and its sandbox flow has been tested.
 */
export function createPaymentProvider({
  provider = "FAKE",
  environment = "SANDBOX",
  webhookSecret,
  mockTokenSecret,
  apiBaseUrl,
  frontendUrl,
  isProduction = false,
} = {}) {
  const name = String(provider ?? "").trim().toUpperCase();

  if (!name) return null;

  if (name === "FAKE") {
    if (isProduction) {
      throw new Error("The FAKE payment provider cannot be used in production.");
    }
    return createFakePaymentProvider({
      webhookSecret,
      mockTokenSecret,
      apiBaseUrl,
      frontendUrl,
      environment,
    });
  }

  throw new Error(
    `Payment provider ${name} is not configured. Only the sandbox FAKE provider is available in Task 09.`,
  );
}

export default createPaymentProvider;
