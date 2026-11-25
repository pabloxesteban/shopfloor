import { Card, CardHeader } from "@/components/ui/card";
import { getOrderStats } from "@/server/queries";
import { KpiRow } from "./kpi-row";
import { WeeklyChart } from "./weekly-chart";

export async function OrderStats() {
  const { kpis, weeks } = await getOrderStats();
  return (
    <div className="space-y-4">
      <KpiRow kpis={kpis} />
      <Card aria-labelledby="weekly-chart-title">
        <CardHeader
          id="weekly-chart-title"
          title="New orders per week"
          description="Last 12 weeks, colored by each order's current status"
        />
        <div className="px-4 py-4 sm:px-5">
          <WeeklyChart weeks={weeks} />
        </div>
      </Card>
    </div>
  );
}
