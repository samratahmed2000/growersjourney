/**
 * Escape user input before placing it in a MongoDB regular expression.
 *
 * Without this, a search such as `.*` would match every record, and a crafted
 * pattern could cause excessive backtracking. The admin search is deliberately
 * a literal, case-insensitive "contains" search.
 */
export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function containsFilter(value) {
  return { $regex: escapeRegex(value), $options: "i" };
}
