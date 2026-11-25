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
 * One bar per week (all new orders, brand-2) with the part still in
 * production laid over it in brand-muted. Drawn as plain SVG to keep the bundle
 * light. It sits on the brand band, so the plain bars get a thin outline to
 * stay visible against the band. Screen readers get the numbers from a table.
 */
export function WeeklyChart({ weeks }: { weeks: WeekBucket[] }) {
  const max = niceMax(Math.max(0, ...weeks.map((w) => w.total)));
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const slot = plotW / weeks.length;
  const barW = Math.min(28, slot * 0.62);
  const y = (n: number) => PAD.top + plotH - (n / max) * plotH;
  const ticks = [0, max / 2, max];

  return (
    <figure>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" aria-hidden="true">
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--brand-muted)" strokeOpacity={0.25} />
            <text x={PAD.left - 6} y={y(tick) + 4} textAnchor="end" fontSize="10" fill="var(--brand-muted)">
              {tick}
            </text>
          </g>
        ))}
        {weeks.map((week, i) => {
          const x = PAD.left + i * slot + (slot - barW) / 2;
          const inProduction = week.counts.in_production;
          return (
            <g key={week.weekStart}>
              {week.total > 0 ? (
                <rect
                  x={x}
                  y={y(week.total)}
                  width={barW}
                  height={y(0) - y(week.total)}
                  rx={2}
                  fill="var(--brand-2)"
                  stroke="var(--brand-muted)"
                  strokeOpacity={0.55}
                />
              ) : null}
              {inProduction > 0 ? (
                <rect x={x} y={y(inProduction)} width={barW} height={y(0) - y(inProduction)} rx={2} fill="var(--brand-muted)" />
              ) : null}
              {i % 2 === weeks.length % 2 ? (
                <text x={x + barW / 2} y={HEIGHT - 6} textAnchor="middle" fontSize="10" fill="var(--brand-muted)">
                  {formatShortDate(week.weekStart)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-3 text-sm text-brand-muted">New orders per week · in production highlighted</figcaption>
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
