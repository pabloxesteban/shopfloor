import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "./cn";

/**
 * Plain semantic table. On narrow screens it scrolls horizontally and the
 * first column stays pinned so each row keeps its label in view.
 */
export function Table({ caption, children, className }: { caption: string; children: ReactNode; className?: string }) {
  return (
    // Focusable so keyboard users can scroll the table sideways on small screens.
    <div className="overflow-x-auto" tabIndex={0} role="group" aria-label={caption}>
      <table className={cn("w-full border-collapse text-sm", className)}>
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
