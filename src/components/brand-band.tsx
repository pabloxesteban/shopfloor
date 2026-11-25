import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

/**
 * Continues the header's brand band full-bleed at the top of a page. The
 * negative top margin cancels main's padding so the two bands read as one.
 */
export function BrandBand({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <section
      aria-label={label}
      className={cn("brand-band band-bleed -mt-6 mb-6 bg-brand py-8 text-brand-fg sm:-mt-8 sm:py-10", className)}
    >
      {children}
    </section>
  );
}
