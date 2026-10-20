export type RawSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

/** Read the first value of a repeated query parameter. */
export function firstValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Build a query string only from values that are actually present. */
export function toQuery(
  values: Record<string, string | number | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === "") continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "?";
}

export function parsePositiveInt(
  value: string | undefined,
  fallback: number,
  max: number,
): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) return fallback;
  return parsed;
}
