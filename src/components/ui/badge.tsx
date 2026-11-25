import type { ReactNode } from "react";
import { STATUS_LABELS, type OrderStatus } from "@/domain/status";
import { cn } from "./cn";

type Tone = "neutral" | "accent" | "danger" | "warning" | "success";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-muted border-border",
  accent: "bg-accent-soft text-accent border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
  warning: "bg-warning-soft text-warning border-transparent",
  success: "bg-success-soft text-success border-transparent",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Status is shown as text with a colored dot. The color is a hint, the text is the signal. */
export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-medium whitespace-nowrap text-text">
      <span aria-hidden="true" className="size-2 rounded-full" style={{ background: `var(--st-${status})` }} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: "normal" | "urgent" }) {
  if (priority === "normal") return <span className="text-xs text-muted">Normal</span>;
  return <Badge tone="danger">Urgent</Badge>;
}
