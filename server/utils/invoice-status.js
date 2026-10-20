/**
 * Invoice status derivation.
 *
 * DRAFT and VOID are lifecycle states controlled by explicit admin actions.
 * Every other status is derived from the verified money ledger and the due
 * date, so a browser or a stale payment record cannot mark an invoice paid.
 */

function dateOnlyParts(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function formatDateParts(parts) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function todayInTimeZone(now = new Date(), timeZone = "UTC") {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(now);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  }
}

function addDays(dateString, days) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return formatDateParts({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
}

/**
 * First due date that is NOT overdue for the given clock.
 *
 * `dueDateOverdueCutoff` returns a date-only string. A due date earlier than
 * this value is overdue; this makes list filtering match `deriveInvoiceStatus`
 * without a scheduled status rewrite.
 */
export function dueDateOverdueCutoff({
  graceDays = 0,
  now = new Date(),
  timeZone = "UTC",
}) {
  const [year, month, day] = todayInTimeZone(now, timeZone)
    .split("-")
    .map(Number);
  const date = new Date(
    Date.UTC(year, month - 1, day - Math.max(0, Number(graceDays) || 0)),
  );
  return formatDateParts({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
}

export function isInvoicePastDue({
  dueDate,
  graceDays = 0,
  now = new Date(),
  timeZone = "UTC",
}) {
  if (!dueDate) return false;
  const dueParts = dateOnlyParts(dueDate);
  if (!dueParts) return false;

  const due = formatDateParts(dueParts);
  const lastAllowedDay = addDays(due, Math.max(0, Number(graceDays) || 0));
  return todayInTimeZone(now, timeZone) > lastAllowedDay;
}

export function deriveInvoiceStatus({
  currentStatus,
  totalMinor,
  amountPaidMinor = 0,
  amountRefundedMinor = 0,
  dueDate,
  graceDays = 0,
  now = new Date(),
  timeZone = "UTC",
}) {
  if (currentStatus === "DRAFT" || currentStatus === "VOID") {
    return currentStatus;
  }

  const netPaid = Math.max(0, amountPaidMinor - amountRefundedMinor);
  if (totalMinor > 0 && netPaid >= totalMinor) {
    return "PAID";
  }

  const overdue = isInvoicePastDue({ dueDate, graceDays, now, timeZone });
  if (overdue) return "OVERDUE";
  if (netPaid > 0) return "PARTIALLY_PAID";
  return "ISSUED";
}
