import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "./cn";

/**
 * Plain semantic table. On narrow screens it scrolls horizontally; cells marked
 * `sticky` keep the first column pinned so each row keeps its label in view.
 * With `cards`, rows stack as cards under `sm` instead and nothing scrolls.
 */
export function Table({
  caption,
  children,
  className,
  cards = false,
}: {
  caption: string;
  children: ReactNode;
  className?: string;
  /** Under `sm`, rows become stacked cards (the table must style its own rows and cells). */
  cards?: boolean;
}) {
  return (
    // Focusable so keyboard users can scroll the table sideways on small screens.
    <div className="overflow-x-auto" tabIndex={0} role="group" aria-label={caption}>
      <table
        // display:block drops native table semantics in some browsers, so card tables state them.
        role={cards ? "table" : undefined}
        className={cn("w-full border-collapse text-sm", cards && "max-sm:block [&_tbody]:max-sm:block", className)}
      >
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function Th({ className, sticky, ...props }: ThHTMLAttributes<HTMLTableCellElement> & { sticky?: boolean }) {
  return (
    <th
      className={cn(
        "border-b border-border bg-surface-muted px-3 py-2 text-left text-xs font-semibold tracking-wide text-muted uppercase",
        sticky && "sticky left-0 z-10",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, sticky, ...props }: TdHTMLAttributes<HTMLTableCellElement> & { sticky?: boolean }) {
  return (
    <td
      className={cn("border-b border-border px-3 py-2.5 align-middle", sticky && "sticky left-0 z-10 bg-surface", className)}
      {...props}
    />
  );
}
