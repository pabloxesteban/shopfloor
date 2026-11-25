import Link from "next/link";
import { BUSINESS_TODAY } from "@/domain/dates";
import type { OrderKpis, WeekBucket } from "@/domain/kpis";
import type { Cents } from "@/domain/money";
import { ordersHref, quickFilterQuery } from "@/domain/orders-query";
import { WeeklyChart } from "./weekly-chart";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** "ARS 21.2M" for the hero. Full precision stays in the table and on order pages. */
export function compactMoney(cents: Cents): string {
  const amount = cents / 100;
  if (Math.abs(amount) < 1000) return `ARS ${Math.round(amount)}`;
  return `ARS ${compact.format(amount)}`;
}

function Secondary({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <>
      <span className="display tabular block text-2xl leading-none sm:text-3xl">{value}</span>
      <span className="mt-1.5 block text-sm text-brand-muted">{label}</span>
    </>
  );
  return (
    <div className="min-w-0">
      {href ? (
        <Link href={href} className="block rounded-md underline-offset-4 hover:underline">
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  );
}

export function OrdersHero({ kpis, weeks }: { kpis: OrderKpis; weeks: WeekBucket[] }) {
  const pastDueHref = ordersHref(quickFilterQuery("past_due", BUSINESS_TODAY));
  const thisWeekHref = ordersHref(quickFilterQuery("this_week", BUSINESS_TODAY));

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-end lg:gap-12">
      <div>
        {kpis.overdue > 0 ? (
          <Link
            href={pastDueHref}
            className="group block rounded-md"
          >
            <span className="flex items-center gap-4">
              <span data-testid="signal-dot" aria-hidden="true" className="size-3 shrink-0 rounded-full bg-signal" />
              <span className="display text-7xl leading-none sm:text-8xl">{kpis.overdue}</span>
            </span>
            {" "}
            <span className="mt-3 block text-lg underline-offset-4 group-hover:underline">
              {kpis.overdue === 1 ? "order past due" : "orders past due"}
            </span>
          </Link>
        ) : (
          <p className="display text-4xl leading-tight sm:text-5xl">No orders past due</p>
        )}
        <div className="mt-8 grid grid-cols-3 gap-4 border-t border-brand-muted/25 pt-5">
          <Secondary label="Open orders" value={String(kpis.openOrders)} />
          <Secondary label="Due this week" value={String(kpis.dueThisWeek)} href={thisWeekHref} />
          <Secondary label="Booked this month" value={compactMoney(kpis.revenueThisMonth)} />
        </div>
      </div>
      <WeeklyChart weeks={weeks} />
    </div>
  );
}
