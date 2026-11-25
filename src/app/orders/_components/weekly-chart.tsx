import { formatShortDate } from "@/domain/dates";
import type { WeekBucket } from "@/domain/kpis";
import { ORDER_STATUSES, STATUS_LABELS } from "@/domain/status";

const WIDTH = 640;
const HEIGHT = 200;
const PAD = { top: 8, right: 8, bottom: 24, left: 28 };

function niceMax(value: number): number {
  if (value <= 4) return 4;
  const step = value <= 10 ? 2 : 5;
  return Math.ceil(value / step) * step;
}

/**
 * Stacked bars drawn as plain SVG. A small hand-written chart keeps the
 * bundle light and lets the colors come from the same tokens as the badges.
 * Screen readers get the same numbers from a hidden table.
 */
export function WeeklyChart({ weeks }: { weeks: WeekBucket[] }) {
  const max = niceMax(Math.max(0, ...weeks.map((w) => w.total)));
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const slot = plotW / weeks.length;
  const barW = Math.min(28, slot * 0.62);
  const y = (n: number) => PAD.top + plotH - (n / max) * plotH;
  const ticks = [0, max / 2, max];
  const present = ORDER_STATUSES.filter((s) => weeks.some((w) => w.counts[s] > 0));

  return (
    <figure>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" aria-hidden="true">
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--border)" />
            <text x={PAD.left - 6} y={y(tick) + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">
              {tick}
            </text>
          </g>
        ))}
        {weeks.map((week, i) => {
          const x = PAD.left + i * slot + (slot - barW) / 2;
          let stacked = 0;
          return (
            <g key={week.weekStart}>
              {ORDER_STATUSES.map((status) => {
                const count = week.counts[status];
                if (count === 0) return null;
                const top = y(stacked + count);
                const height = y(stacked) - top;
                stacked += count;
                return <rect key={status} x={x} y={top} width={barW} height={Math.max(height - 1, 1)} rx={2} fill={`var(--text-muted)`} />;
              })}
              {i % 2 === weeks.length % 2 ? (
                <text x={x + barW / 2} y={HEIGHT - 6} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
                  {formatShortDate(week.weekStart)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {present.map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ background: `var(--text-muted)` }} />
            {STATUS_LABELS[status]}
          </span>
        ))}
      </figcaption>
      {/* Wrapped: tables ignore the 1px size of sr-only and would widen the page. */}
      <div className="sr-only">
      <table>
        <caption>Orders created per week, by current status</caption>
        <thead>
          <tr>
            <th scope="col">Week of</th>
            {ORDER_STATUSES.map((s) => (
              <th key={s} scope="col">
                {STATUS_LABELS[s]}
              </th>
            ))}
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.weekStart}>
              <th scope="row">{formatShortDate(week.weekStart)}</th>
              {ORDER_STATUSES.map((s) => (
                <td key={s}>{week.counts[s]}</td>
              ))}
              <td>{week.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </figure>
  );
}
