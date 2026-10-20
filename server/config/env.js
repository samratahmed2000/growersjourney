import "dotenv/config";

/**
 * Central, validated environment configuration — BACKEND ONLY.
 *
 * Why this file exists:
 * - Environment loading happens in exactly one place, so the rest of the server
 *   never reads `process.env` directly.
 * - Required variables are validated during startup, so the process fails
 *   immediately and clearly instead of crashing later inside a request.
 * - Secret values are NEVER logged. Error messages name the variable only.
 *
 * Rules kept here on purpose:
 * - Nothing in this file is ever imported by frontend code.
 * - No value from this file may be exposed through a NEXT_PUBLIC_* variable.
 */

const DEFAULT_PORT = 5000;
const DEFAULT_FRONTEND_URL = "http://localhost:3000";

/** Declared early because authentication validation depends on it. */
const rawNodeEnv = (process.env.NODE_ENV ?? "").trim().toLowerCase();
const nodeEnv = rawNodeEnv || "development";
const isProduction = nodeEnv === "production";

const problems = [];
const warnings = [];

if (
  rawNodeEnv &&
  !["development", "test", "production"].includes(rawNodeEnv)
) {
  problems.push(
    "NODE_ENV must be one of development, test, or production.",
  );
} else if (!rawNodeEnv) {
  warnings.push(
    "NODE_ENV is not set; defaulting to development. Set NODE_ENV=production in production.",
  );
}

/** Print safe, actionable messages and stop the process. */
function fail(messages) {
  console.error("\n[config] Startup configuration problem(s):");
  for (const message of messages) {
    console.error(`  - ${message}`);
  }
  console.error(
    "\nFix server/.env (copy server/.env.example if needed), then start the server again.\n",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// MONGODB_URI — required. Validated for shape only; the value is never printed.
// ---------------------------------------------------------------------------
const mongodbUri = (process.env.MONGODB_URI ?? "").trim();
let databaseName = "";

if (!mongodbUri) {
  problems.push(
    "MONGODB_URI is missing. Set it to your MongoDB Atlas connection string.",
  );
} else if (!/^mongodb(\+srv)?:\/\//.test(mongodbUri)) {
  problems.push('MONGODB_URI must start with "mongodb://" or "mongodb+srv://".');
} else {
  try {
    // URL parsing is only used to confirm the string is well formed and that a
    // database name is present. The parsed parts are never logged.
    const withoutQuery = mongodbUri.split("?")[0];
    const pathStart = withoutQuery.indexOf("/", withoutQuery.indexOf("//") + 2);
    databaseName = pathStart === -1 ? "" : withoutQuery.slice(pathStart + 1);

    if (!databaseName) {
      problems.push(
        'MONGODB_URI must include a database name, for example ".../growers_journy?retryWrites=true".',
      );
    } else if (/%[0-9a-fA-F]{2}/.test(databaseName) || /\s/.test(databaseName)) {
      problems.push(
        "MONGODB_URI does not contain a valid database name. URL-encode special characters in the username and password.",
      );
      databaseName = "";
    }
  } catch {
    problems.push("MONGODB_URI could not be parsed as a valid connection string.");
  }
}

// ---------------------------------------------------------------------------
// MONGODB_TRANSACTIONS — optional, defaults to true.
//
// Better Auth's MongoDB adapter can wrap multi-document writes in a
// transaction. Atlas replica sets support this. A standalone local `mongod`
// does not, so set MONGODB_TRANSACTIONS=false in that one case.
// ---------------------------------------------------------------------------
const rawMongoTransactions = (process.env.MONGODB_TRANSACTIONS ?? "")
  .trim()
  .toLowerCase();
let mongodbTransactions = true;

if (rawMongoTransactions && !["true", "false"].includes(rawMongoTransactions)) {
  problems.push("MONGODB_TRANSACTIONS must be true or false.");
} else if (rawMongoTransactions === "false") {
  mongodbTransactions = false;
}

// ---------------------------------------------------------------------------
// BETTER_AUTH_SECRET — required. Never printed, never sent to the frontend.
//
// This is the key Better Auth uses to sign session cookies and encrypt
// verification data. A short or guessable value would let an attacker forge a
// session, so a hard minimum is enforced here as well as in createAuth().
// Generate one with: openssl rand -base64 32
// ---------------------------------------------------------------------------
const betterAuthSecret = (process.env.BETTER_AUTH_SECRET ?? "").trim();

if (!betterAuthSecret) {
  problems.push(
    "BETTER_AUTH_SECRET is missing. Generate one with `openssl rand -base64 32`.",
  );
} else if (betterAuthSecret.length < 32) {
  problems.push("BETTER_AUTH_SECRET must be at least 32 characters long.");
}

// ---------------------------------------------------------------------------
// BETTER_AUTH_URL — required. The PUBLIC FRONTEND origin, not the API origin.
//
// The browser talks to /api/auth on the Next.js origin, which rewrites to this
// Express server. Better Auth uses this value for links and for deciding
// whether cookies need the Secure attribute, so it must match what the browser
// actually sees. HTTPS is required in production.
// ---------------------------------------------------------------------------
const rawBetterAuthUrl = (process.env.BETTER_AUTH_URL ?? "").trim();
let betterAuthUrl = "";

if (!rawBetterAuthUrl) {
  problems.push(
    "BETTER_AUTH_URL is missing. Set it to the public frontend origin, for example http://localhost:3000.",
  );
} else {
  try {
    const parsed = new URL(rawBetterAuthUrl);

    if (!/^https?:$/.test(parsed.protocol)) {
      problems.push("BETTER_AUTH_URL must use http:// or https://.");
    } else if (isProduction && parsed.protocol !== "https:") {
      problems.push("BETTER_AUTH_URL must use https:// in production.");
    } else {
      // Keep the origin (and any deliberate path prefix), but drop a trailing
      // slash so URL construction is predictable.
      betterAuthUrl = parsed.href.replace(/\/+$/, "");
    }
  } catch {
    problems.push(
      "BETTER_AUTH_URL could not be parsed. Use an absolute URL such as https://growersjourny.com.",
    );
  }
}

// ---------------------------------------------------------------------------
// PORT — optional, must be a valid port number when provided.
// ---------------------------------------------------------------------------
const rawPort = (process.env.PORT ?? "").trim();
let port = DEFAULT_PORT;

if (rawPort) {
  const parsedPort = Number.parseInt(rawPort, 10);
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    problems.push("PORT must be a whole number between 1 and 65535.");
  } else {
    port = parsedPort;
  }
}

// ---------------------------------------------------------------------------
// FRONTEND_URL — optional, used as the CORS and Better Auth origin allowlist.
//
// Each entry must be an exact origin (scheme + host + optional port). A path,
// query, fragment, credentials, or wildcard is rejected: the value is compared
// literally against the browser's Origin header, so a malformed entry would
// silently fail to match instead of allowing the intended site.
// ---------------------------------------------------------------------------
const rawFrontendUrls = (process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const frontendUrls = [];

if (rawFrontendUrls.length === 0) {
  problems.push("FRONTEND_URL must contain at least one frontend origin.");
}

for (const rawOrigin of rawFrontendUrls) {
  if (rawOrigin === "*") {
    problems.push('FRONTEND_URL must not contain "*"; list exact origins instead.');
    continue;
  }

  try {
    const parsed = new URL(rawOrigin);

    if (!/^https?:$/.test(parsed.protocol)) {
      problems.push("FRONTEND_URL entries must use http:// or https://.");
      continue;
    }

    if (
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      problems.push(
        "FRONTEND_URL entries must be origins only, for example https://growersjourny.com.",
      );
      continue;
    }

    frontendUrls.push(parsed.origin);
  } catch {
    problems.push(
      "FRONTEND_URL contains an entry that is not a valid absolute URL.",
    );
  }
}

// ---------------------------------------------------------------------------
// TRUST_PROXY — optional. `false` by default.
//
// Express needs to know how many reverse-proxy hops sit in front of it before
// it can read the real client IP from X-Forwarded-For. That IP is what the
// public rate limiter counts, so getting this wrong matters:
//   - `false` (default): the socket address is used. Correct when the API is
//     reached directly, or in local development.
//   - a number 1-10: trust that many hops. Correct behind one known proxy or
//     load balancer (for example a single platform edge).
// A permissive `true` is deliberately NOT accepted: it would trust a header any
// caller can forge, letting a bot reset its own rate-limit bucket at will.
// ---------------------------------------------------------------------------
const rawTrustProxy = (process.env.TRUST_PROXY ?? "").trim();
let trustProxy = false;

if (rawTrustProxy && rawTrustProxy.toLowerCase() !== "false") {
  if (!/^\d+$/.test(rawTrustProxy)) {
    problems.push(
      "TRUST_PROXY must be false or a hop count between 1 and 10 (for example TRUST_PROXY=1).",
    );
  } else {
    const hops = Number.parseInt(rawTrustProxy, 10);
    if (hops > 10) {
      problems.push("TRUST_PROXY must be false or a hop count between 1 and 10.");
    } else if (hops > 0) {
      trustProxy = hops;
    }
  }
}

// ---------------------------------------------------------------------------
// INVOICE_* — invoice numbering, money, and due-date policy.
// ---------------------------------------------------------------------------
const rawInvoiceCurrencies = (
  process.env.INVOICE_SUPPORTED_CURRENCIES ?? "BDT"
)
  .split(",")
  .map((value) => value.trim().toUpperCase())
  .filter(Boolean);
const invoiceSupportedCurrencies = [...new Set(rawInvoiceCurrencies)];

if (invoiceSupportedCurrencies.length === 0) {
  problems.push("INVOICE_SUPPORTED_CURRENCIES must contain at least one currency code.");
} else {
  for (const currency of invoiceSupportedCurrencies) {
    if (!/^[A-Z]{3}$/.test(currency)) {
      problems.push(
        "INVOICE_SUPPORTED_CURRENCIES entries must be three-letter currency codes.",
      );
      break;
    }
  }
}

const rawInvoiceTaxEnabled = (process.env.INVOICE_TAX_ENABLED ?? "false")
  .trim()
  .toLowerCase();
let invoiceTaxEnabled = false;
if (!["true", "false"].includes(rawInvoiceTaxEnabled)) {
  problems.push("INVOICE_TAX_ENABLED must be true or false.");
} else {
  invoiceTaxEnabled = rawInvoiceTaxEnabled === "true";
}

const rawInvoiceDiscountEnabled = (
  process.env.INVOICE_DISCOUNT_ENABLED ?? "false"
)
  .trim()
  .toLowerCase();
let invoiceDiscountEnabled = false;
if (!["true", "false"].includes(rawInvoiceDiscountEnabled)) {
  problems.push("INVOICE_DISCOUNT_ENABLED must be true or false.");
} else {
  invoiceDiscountEnabled = rawInvoiceDiscountEnabled === "true";
}

const invoiceTimezone = (process.env.INVOICE_TIMEZONE ?? "Asia/Dhaka").trim();
try {
  new Intl.DateTimeFormat("en-US", { timeZone: invoiceTimezone }).format(new Date());
} catch {
  problems.push(
    "INVOICE_TIMEZONE must be a valid IANA time zone, for example Asia/Dhaka.",
  );
}

const rawInvoiceGraceDays = (process.env.INVOICE_OVERDUE_GRACE_DAYS ?? "0").trim();
let invoiceOverdueGraceDays = 0;
if (!/^\d+$/.test(rawInvoiceGraceDays)) {
  problems.push("INVOICE_OVERDUE_GRACE_DAYS must be a whole number between 0 and 60.");
} else {
  const parsed = Number.parseInt(rawInvoiceGraceDays, 10);
  if (parsed > 60) {
    problems.push("INVOICE_OVERDUE_GRACE_DAYS must be a whole number between 0 and 60.");
  } else {
    invoiceOverdueGraceDays = parsed;
  }
}

const invoiceNumberPrefix = (process.env.INVOICE_NUMBER_PREFIX ?? "INV")
  .trim()
  .toUpperCase();
if (!/^[A-Z0-9-]{1,12}$/.test(invoiceNumberPrefix)) {
  problems.push(
    "INVOICE_NUMBER_PREFIX must be 1-12 letters, numbers, or hyphens.",
  );
}

// ---------------------------------------------------------------------------
// PAYMENTS_* — provider-independent payment foundation.
//
// The only implemented provider in Task 09 is the local FAKE sandbox adapter.
// It is refused in production and never moves money. A real provider must be
// added deliberately after merchant, fee, settlement, refund, and webhook
// contracts are confirmed.
//
// Payments are enabled by default in development so the mock flow is usable,
// and disabled by default in production until explicitly configured.
// ---------------------------------------------------------------------------
const rawPaymentsEnabled = (
  process.env.PAYMENTS_ENABLED ?? (isProduction ? "false" : "true")
)
  .trim()
  .toLowerCase();
let paymentsEnabled = false;
if (!["true", "false"].includes(rawPaymentsEnabled)) {
  problems.push("PAYMENTS_ENABLED must be true or false.");
} else {
  paymentsEnabled = rawPaymentsEnabled === "true";
}

const paymentProvider = (
  process.env.PAYMENT_PROVIDER ?? (paymentsEnabled ? "FAKE" : "")
)
  .trim()
  .toUpperCase();

if (paymentsEnabled && !paymentProvider) {
  problems.push("PAYMENT_PROVIDER is required when PAYMENTS_ENABLED=true.");
} else if (paymentProvider && paymentProvider !== "FAKE") {
  problems.push(
    "PAYMENT_PROVIDER currently supports only FAKE (sandbox). Add a reviewed adapter before enabling another provider.",
  );
}

if (paymentsEnabled && isProduction && paymentProvider === "FAKE") {
  problems.push("PAYMENT_PROVIDER=FAKE cannot be used in production.");
}

const paymentEnvironment = (
  process.env.PAYMENT_ENVIRONMENT ?? "SANDBOX"
)
  .trim()
  .toUpperCase();
if (!["SANDBOX", "LIVE"].includes(paymentEnvironment)) {
  problems.push("PAYMENT_ENVIRONMENT must be SANDBOX or LIVE.");
} else if (
  paymentsEnabled &&
  paymentProvider === "FAKE" &&
  paymentEnvironment === "LIVE"
) {
  problems.push("PAYMENT_ENVIRONMENT=live cannot be used with the FAKE provider.");
}

const paymentWebhookSecret = (process.env.PAYMENT_WEBHOOK_SECRET ?? "").trim();
if (paymentsEnabled && paymentWebhookSecret.length < 32) {
  problems.push(
    "PAYMENT_WEBHOOK_SECRET must be at least 32 characters when payments are enabled.",
  );
}

const rawMockTokenSecret = (process.env.PAYMENT_MOCK_TOKEN_SECRET ?? "").trim();
const paymentMockTokenSecret = rawMockTokenSecret || paymentWebhookSecret;
if (
  paymentsEnabled &&
  paymentProvider === "FAKE" &&
  paymentMockTokenSecret.length < 32
) {
  problems.push(
    "PAYMENT_MOCK_TOKEN_SECRET must be at least 32 characters for the FAKE provider.",
  );
}

const rawPaymentPublicBaseUrl = (
  process.env.PAYMENT_PUBLIC_BASE_URL ?? `http://localhost:${port}`
).trim();
let paymentPublicBaseUrl = "";
try {
  const parsed = new URL(rawPaymentPublicBaseUrl);
  if (!/^https?:$/.test(parsed.protocol)) {
    problems.push("PAYMENT_PUBLIC_BASE_URL must use http:// or https://.");
  } else if (isProduction && parsed.protocol !== "https:") {
    problems.push("PAYMENT_PUBLIC_BASE_URL must use https:// in production.");
  } else {
    paymentPublicBaseUrl = parsed.href.replace(/\/+$/, "");
  }
} catch {
  problems.push(
    "PAYMENT_PUBLIC_BASE_URL must be an absolute URL such as https://api.growersjourny.com.",
  );
}

if (paymentsEnabled && !rawNodeEnv) {
  problems.push(
    "NODE_ENV must be set explicitly when PAYMENTS_ENABLED=true. Use NODE_ENV=development locally and NODE_ENV=production in production.",
  );
}

if (problems.length > 0) {
  fail(problems);
}

for (const warning of warnings) {
  console.warn(`[config] Warning: ${warning}`);
}

/** Frozen, validated configuration. Import this instead of reading process.env. */
export const env = Object.freeze({
  nodeEnv,
  isProduction,
  port,
  frontendUrls,
  trustProxy,
  mongodbUri,
  databaseName,
  mongodbTransactions,
  betterAuthSecret,
  betterAuthUrl,
  invoiceSupportedCurrencies,
  invoiceTaxEnabled,
  invoiceDiscountEnabled,
  invoiceTimezone,
  invoiceOverdueGraceDays,
  invoiceNumberPrefix,
  paymentsEnabled,
  paymentProvider,
  paymentEnvironment,
  paymentWebhookSecret,
  paymentMockTokenSecret,
  paymentPublicBaseUrl,
});
