import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

const control =
  "block w-full rounded-md border bg-surface px-3 text-sm text-text placeholder:text-muted " +
  "border-border-strong aria-[invalid=true]:border-danger disabled:opacity-60";

export function errorId(id: string) {
  return `${id}-error`;
}

function describedBy(id: string | undefined, error: string | undefined, extra?: string) {
  const ids = [error && id ? errorId(id) : undefined, extra].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

interface ControlProps {
  error?: string;
}

export function Input({ error, className, id, ...props }: InputHTMLAttributes<HTMLInputElement> & ControlProps) {
  return (
    <input
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, error, props["aria-describedby"])}
      className={cn(control, "h-10", className)}
      {...props}
    />
  );
}

export function Select({ error, className, id, ...props }: SelectHTMLAttributes<HTMLSelectElement> & ControlProps) {
  return (
    <select
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, error, props["aria-describedby"])}
      className={cn(control, "h-10 pr-8", className)}
      {...props}
    />
  );
}

export function Textarea({ error, className, id, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & ControlProps) {
  return (
    <textarea
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, error, props["aria-describedby"])}
      className={cn(control, "min-h-20 py-2", className)}
      {...props}
    />
  );
}

interface FieldProps {
  id: string;
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  className?: string;
  /** Visually hide the label (still read by screen readers). */
  hideLabel?: boolean;
  children: ReactNode;
}

/** Label, control and error message wired together by id. */
export function Field({ id, label, error, hint, className, hideLabel, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={id} className={cn("text-sm font-medium text-text", hideLabel && "sr-only")}>
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p id={errorId(id)} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
