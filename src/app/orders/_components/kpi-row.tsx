import type { OrderKpis } from "@/domain/kpis";
import { formatMoney } from "@/domain/money";

interface Kpi {
  label: string;
  value: string;
  hint: string;
  tone?: "danger";
}

export function KpiRow({ kpis }: { kpis: OrderKpis }) {
  const items: Kpi[] = [
    { label: "Open orders", value: String(kpis.openOrders), hint: "Confirmed, in production or ready" },
    { label: "Due this week", value: String(kpis.dueThisWeek), hint: "Open orders due Monday to Sunday" },
    {
      label: "Overdue",
      value: String(kpis.overdue),
      hint: "Open orders past their due date",
      tone: kpis.overdue > 0 ? "danger" : undefined,
    },
    {
      label: "Revenue this month",
      value: formatMoney(kpis.revenueThisMonth),
      hint: "Orders booked this month, excluding quotes",
    },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border bg-surface px-4 py-3">
          <dt className="text-xs font-medium text-muted">{item.label}</dt>
          <dd
            className={
              "tabular mt-1 truncate text-xl font-semibold sm:text-2xl " + (item.tone === "danger" ? "text-danger" : "text-text")
            }
          >
            {item.value}
          </dd>
          <dd className="mt-1 text-xs text-muted">{item.hint}</dd>
        </div>
      ))}
    </dl>
  );
}
