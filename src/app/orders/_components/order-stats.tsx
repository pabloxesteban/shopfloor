import { getOrderStats } from "@/server/queries";
import { OrdersHero } from "./orders-hero";

export async function OrderStats() {
  const { kpis, weeks } = await getOrderStats();
  return <OrdersHero kpis={kpis} weeks={weeks} />;
}
