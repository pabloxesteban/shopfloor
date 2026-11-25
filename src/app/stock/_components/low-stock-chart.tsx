import { available, UNIT_LABELS, type Material } from "@/domain/material";

/**
 * One bar per low item: available stock against its reorder point, with
 * anything already ordered shown as a lighter extension. Built from divs so
 * it wraps to any width; the numbers are always printed next to the bar.
 */
export function LowStockChart({ materials }: { materials: Material[] }) {
  if (materials.length === 0) {
    return <p className="text-sm text-muted">Nothing is below its reorder point.</p>;
  }
  const scale = Math.max(...materials.map((m) => Math.max(m.reorderPoint, available(m) + m.incoming))) || 1;
  const pct = (value: number) => `${Math.max(0, (value / scale) * 100)}%`;

  return (
    <ul className="space-y-4">
      {materials.map((m) => {
        const avail = available(m);
        return (
          <li key={m.sku}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="font-medium">{m.name}</span>
              <span className="tabular text-xs text-muted">
                {avail} available{m.incoming > 0 ? ` + ${m.incoming} incoming` : ""} · reorder at {m.reorderPoint}{" "}
                {UNIT_LABELS[m.unit]}
              </span>
            </div>
            <div className="relative mt-1.5 h-3 rounded-full bg-surface-muted" aria-hidden="true">
              <div className="absolute inset-y-0 left-0 flex overflow-hidden rounded-full" style={{ width: pct(avail + m.incoming) }}>
                <div className="h-full bg-signal-ink" style={{ width: avail + m.incoming > 0 ? `${(Math.max(avail, 0) / (avail + m.incoming)) * 100}%` : 0 }} />
                <div className="h-full flex-1 bg-signal-ink/35" />
              </div>
              <div className="absolute -inset-y-1 w-0.5 bg-text" style={{ left: pct(m.reorderPoint) }} title="Reorder point" />
            </div>
          </li>
        );
      })}
      <li className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted" aria-hidden="true">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-signal-ink" /> Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-signal-ink/35" /> Incoming
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-0.5 bg-text" /> Reorder point
        </span>
      </li>
    </ul>
  );
}
