import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type Variant = "signal" | "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  signal: "bg-signal text-signal-fg hover:brightness-95 border-transparent",
  primary: "bg-accent text-accent-fg hover:bg-accent-hover border-transparent",
  secondary: "bg-surface text-text border-border-strong hover:bg-surface-muted",
  ghost: "bg-transparent text-text border-transparent hover:bg-surface-muted",
  danger: "bg-danger text-white border-transparent hover:opacity-90 dark:text-black",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-12 px-4 text-sm gap-2 sm:h-11",
};

/** Shared so links can look like buttons without nesting interactive elements. */
export function buttonClasses({ variant = "secondary", size = "md" }: { variant?: Variant; size?: Size } = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-lg border font-medium whitespace-nowrap transition-colors duration-150",
    "disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    sizes[size],
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonClasses({ variant, size }), className)} {...props} />;
}
