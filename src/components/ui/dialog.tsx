"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  onClose: () => void;
  /** Rendered inside the dialog, usually the form that performs the action. */
  children: ReactNode;
}

/**
 * Native <dialog> opened with showModal(): the browser handles focus
 * trapping, Escape to close and the inert background.
 */
export function ConfirmDialog({ open, title, description, onClose, children }: ConfirmDialogProps) {
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
      onClose={onClose}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-border bg-surface p-0 text-text shadow-xl backdrop:bg-black/40"
    >
      <div className="p-5">
        <h2 id={titleId} className="text-base font-semibold">
          {title}
        </h2>
        <div id={descriptionId} className="mt-2 text-sm text-muted">
          {description}
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </dialog>
  );
}
