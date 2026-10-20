"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";

/**
 * Native <dialog> confirmation.
 *
 * Native modal dialogs provide the focus trap, Escape handling, backdrop, and
 * focus return. We only control opening and closing, which keeps the accessible
 * behaviour in the browser instead of reimplementing it.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  pending = false,
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onCancel();
      }}
      onClose={() => {
        if (open && !pending) onCancel();
      }}
      className="w-[min(92vw,460px)] rounded-2xl border border-line bg-surface p-0 text-ink shadow-xl backdrop:bg-brand-950/50"
    >
      <div className="p-6">
        <h2 id={titleId} className="text-lg font-semibold text-ink">
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted">
          {description}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={pending}
            aria-busy={pending}
            className={
              danger
                ? "bg-red-700 text-white hover:bg-red-800"
                : undefined
            }
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
