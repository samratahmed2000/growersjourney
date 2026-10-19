/**
 * Join class names, dropping falsy values.
 *
 * Why a local helper instead of clsx + tailwind-merge:
 * the project avoids dependencies it does not need, and this site never
 * composes conflicting Tailwind utilities that would require merge semantics.
 * Keep it simple until there is a real reason to add a library.
 */
export function cn(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}
