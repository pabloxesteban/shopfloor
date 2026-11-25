import { STAGES, STATUS_LABELS, stageProgress, type OrderStatus } from "@/domain/status";
import { cn } from "./cn";

/**
 * Five-step progress bar with the status written out next to it. The segments
 * are decoration (aria-hidden); the text is what screen readers read.
 */
export function StageBar({ status, size = "sm", onBrand = false, className }: { status: OrderStatus; size?: "sm" | "lg"; onBrand?: boolean; className?: string }) {
  const { step, cancelled } = stageProgress(status);
  const large = size === "lg";
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap", large ? "gap-3" : "gap-2", className)}>
      <span aria-hidden="true" className={cn("flex items-center", large ? "w-32 gap-1" : "w-14 gap-0.5")}>
        {STAGES.map((stage, index) => (
          <span
            key={stage}
            data-segment=""
            data-filled={index <= step ? "true" : "false"}
            className={cn("flex-1 rounded-full", large ? "h-2" : "h-1.5", index <= step ? (onBrand ? "bg-brand-muted" : "bg-accent") : onBrand ? "bg-brand-fg/25" : "bg-border-strong")}
          />
        ))}
      </span>
      <span className={cn("font-medium", large ? "text-base" : "text-sm", onBrand ? (cancelled ? "text-brand-muted" : "text-brand-fg") : cancelled ? "text-muted" : "text-text")}>
        {STATUS_LABELS[status]}
      </span>
    </span>
  );
}
