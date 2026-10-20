import type { ReactNode } from "react";

export function FormField({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="ml-1 text-red-700" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {hint ? (
        <p id={hintId} className="mt-1 text-xs leading-5 text-muted">
          {hint}
        </p>
      ) : null}
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function fieldDescribedBy(
  id: string,
  { hint, error }: { hint?: boolean; error?: string },
): string | undefined {
  const values = [];
  if (hint) values.push(`${id}-hint`);
  if (error) values.push(`${id}-error`);
  return values.length ? values.join(" ") : undefined;
}
