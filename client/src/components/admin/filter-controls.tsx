import type { ReactNode } from "react";

export { Input, Select } from "@/components/ui/field-controls";

export function FilterField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
