import { badRequest } from "./http-error.js";

/**
 * Money helpers.
 *
 * Every amount is an integer in the currency's smallest standard unit. For BDT
 * that is poisha (1 BDT = 100 poisha). No floating-point arithmetic is used for
 * stored money, and quantity is stored as thousandths so 1.5 becomes 1500.
 */

export const CURRENCY_EXPONENTS = Object.freeze({
  BDT: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  INR: 2,
  SGD: 2,
});

export const MAX_SAFE_AMOUNT_MINOR = 10_000_000_000_000;

export function normalizeCurrency(value, supportedCurrencies = ["BDT"]) {
  const currency = String(value ?? "")
    .trim()
    .toUpperCase();

  if (!supportedCurrencies.includes(currency)) {
    throw badRequest(
      "Please select a supported invoice currency.",
      [{ field: "body.currency", message: "This currency is not enabled." }],
    );
  }

  return currency;
}

export function currencyExponent(currency) {
  const exponent = CURRENCY_EXPONENTS[String(currency).toUpperCase()];
  return Number.isInteger(exponent) ? exponent : 2;
}

export function assertMinorAmount(value, field = "amountMinor", { allowZero = true } = {}) {
  if (!Number.isSafeInteger(value) || value < (allowZero ? 0 : 1)) {
    throw badRequest("Please enter a valid monetary amount.", [
      { field, message: "The amount must be a whole number of minor units." },
    ]);
  }

  if (value > MAX_SAFE_AMOUNT_MINOR) {
    throw badRequest("The monetary amount is too large.", [
      { field, message: "The amount exceeds the supported limit." },
    ]);
  }

  return value;
}

/**
 * Compute one line total and the invoice totals from validated line items.
 * Quantity is `quantityMilli`; rounding happens once per line.
 */
export function calculateInvoiceTotals({
  items,
  discountMinor = 0,
  taxRateBps = 0,
  discountEnabled = false,
  taxEnabled = false,
}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw badRequest("An invoice needs at least one line item.");
  }

  const lineItems = items.map((item, index) => {
    const description = String(item.description ?? "").trim();
    if (!description) {
      throw badRequest("Each invoice line needs a description.", [
        { field: `body.lineItems.${index}.description`, message: "Description is required." },
      ]);
    }

    const quantityMilli = item.quantityMilli;
    if (!Number.isSafeInteger(quantityMilli) || quantityMilli <= 0) {
      throw badRequest("Each line needs a positive quantity.", [
        { field: `body.lineItems.${index}.quantity`, message: "Quantity must be greater than zero." },
      ]);
    }

    assertMinorAmount(item.unitAmountMinor, `body.lineItems.${index}.unitAmountMinor`);

    const lineTotalMinor = Math.round(
      (quantityMilli * item.unitAmountMinor) / 1000,
    );

    if (!Number.isSafeInteger(lineTotalMinor) || lineTotalMinor < 0) {
      throw badRequest("The line total is too large.", [
        { field: `body.lineItems.${index}.quantity`, message: "This line total is too large." },
      ]);
    }

    return {
      description,
      quantityMilli,
      unitAmountMinor: item.unitAmountMinor,
      lineTotalMinor,
    };
  });

  const subtotalMinor = lineItems.reduce(
    (total, item) => total + item.lineTotalMinor,
    0,
  );
  assertMinorAmount(subtotalMinor, "body.lineItems");

  const normalizedDiscount = discountMinor ?? 0;
  assertMinorAmount(normalizedDiscount, "body.discountMinor");

  if (normalizedDiscount > 0 && !discountEnabled) {
    throw badRequest("Discounts are not enabled for invoices.", [
      { field: "body.discountMinor", message: "Discounts are disabled." },
    ]);
  }

  if (normalizedDiscount > subtotalMinor) {
    throw badRequest("The discount cannot exceed the subtotal.", [
      { field: "body.discountMinor", message: "Discount cannot exceed the subtotal." },
    ]);
  }

  const normalizedRate = taxRateBps ?? 0;
  if (!Number.isInteger(normalizedRate) || normalizedRate < 0 || normalizedRate > 10000) {
    throw badRequest("The tax rate is invalid.", [
      { field: "body.taxRateBps", message: "Tax rate must be between 0 and 10000 basis points." },
    ]);
  }

  if (normalizedRate > 0 && !taxEnabled) {
    throw badRequest("Tax is not enabled for invoices.", [
      { field: "body.taxRateBps", message: "Tax is disabled." },
    ]);
  }

  const taxableMinor = subtotalMinor - normalizedDiscount;
  const taxMinor = Math.round((taxableMinor * normalizedRate) / 10000);
  const totalMinor = taxableMinor + taxMinor;

  assertMinorAmount(totalMinor, "body.lineItems");

  return {
    lineItems,
    subtotalMinor,
    discountMinor: normalizedDiscount,
    taxRateBps: normalizedRate,
    taxMinor,
    totalMinor,
  };
}

export function netPaidMinor({ amountPaidMinor = 0, amountRefundedMinor = 0 }) {
  return Math.max(0, amountPaidMinor - amountRefundedMinor);
}

export function balanceDueMinor({
  totalMinor = 0,
  amountPaidMinor = 0,
  amountRefundedMinor = 0,
}) {
  return Math.max(0, totalMinor - netPaidMinor({ amountPaidMinor, amountRefundedMinor }));
}

export function overpaidMinor({
  totalMinor = 0,
  amountPaidMinor = 0,
  amountRefundedMinor = 0,
}) {
  return Math.max(0, netPaidMinor({ amountPaidMinor, amountRefundedMinor }) - totalMinor);
}

/** Convert integer minor units to a fixed-decimal string for provider payloads. */
export function minorAmountToDecimalString(amountMinor, currency = "BDT") {
  const exponent = currencyExponent(currency);
  const negative = amountMinor < 0;
  const absolute = Math.abs(amountMinor);
  const scale = 10 ** exponent;
  const whole = Math.floor(absolute / scale);
  const fraction = String(absolute % scale).padStart(exponent, "0");
  const value = exponent === 0 ? String(whole) : `${whole}.${fraction}`;
  return negative ? `-${value}` : value;
}
