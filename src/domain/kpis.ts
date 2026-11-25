import { addDays, startOfMonth, startOfWeek } from "./dates";
import type { Cents } from "./money";
import type { Order } from "./order";
import { orderTotal } from "./order";
import { isOpen, ORDER_STATUSES, type OrderStatus } from "./status";

export interface OrderKpis {
  openOrders: number;
  dueThisWeek: number;
  overdue: number;
  revenueThisMonth: Cents;
}

/**
 * - Open: confirmed, in production or ready.
 * - Due this week: open orders due between Monday and Sunday of this week.
 * - Overdue: open orders whose due date is before today.
 * - Revenue this month: value of orders created this month that are past the
 *   quote stage and not cancelled (booked work, not cash received).
 */
export function computeKpis(orders: readonly Order[], today: string): OrderKpis {
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const monthStart = startOfMonth(today);

  let openOrders = 0;
  let dueThisWeek = 0;
  let overdue = 0;
  let revenueThisMonth = 0;

  for (const order of orders) {
    if (isOpen(order.status)) {
      openOrders += 1;
      if (order.dueDate >= weekStart && order.dueDate <= weekEnd) dueThisWeek += 1;
      if (order.dueDate < today) overdue += 1;
    }
    const createdOn = order.createdAt.slice(0, 10);
    const booked = order.status !== "quote" && order.status !== "cancelled";
    if (booked && createdOn >= monthStart && createdOn <= today) {
      revenueThisMonth += orderTotal(order);
    }
  }
  return { openOrders, dueThisWeek, overdue, revenueThisMonth };
}

export interface WeekBucket {
  weekStart: string;
  counts: Record<OrderStatus, number>;
  total: number;
}

const emptyCounts = (): Record<OrderStatus, number> =>
  Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;

/** Orders created per week over the last `weeks` weeks, split by current status. */
export function weeklyOrderCounts(orders: readonly Order[], today: string, weeks = 12): WeekBucket[] {
  const lastWeek = startOfWeek(today);
  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    buckets.push({ weekStart: addDays(lastWeek, -7 * i), counts: emptyCounts(), total: 0 });
  }
  const index = new Map(buckets.map((b, i) => [b.weekStart, i]));

  for (const order of orders) {
    const week = startOfWeek(order.createdAt.slice(0, 10));
    const position = index.get(week);
    if (position === undefined) continue;
    const bucket = buckets[position];
    if (!bucket) continue;
    bucket.counts[order.status] += 1;
    bucket.total += 1;
  }
  return buckets;
}
