import { describe, expect, it } from "vitest";
import { computeKpis, weeklyOrderCounts } from "./kpis";
import type { Order } from "./order";
import { orderTotal } from "./order";
import type { OrderStatus } from "./status";

const TODAY = "2026-11-18"; // Wednesday; week runs 16 to 22 Nov

function order(id: number, status: OrderStatus, createdOn: string, dueDate: string): Order {
  return {
    id: `ORD-${1000 + id}`,
    customer: { name: "Test Customer", town: "Lanús" },
    status,
    priority: "normal",
    createdAt: `${createdOn}T12:00:00.000Z`,
    dueDate,
    items: [
      {
        productType: "fixed-panel",
        series: "Herrero",
        widthCm: 100,
        heightCm: 100,
        glass: "single",
        color: "White",
        quantity: 1,
      },
    ],
  };
}

describe("computeKpis", () => {
  const orders = [
    order(1, "confirmed", "2026-11-02", "2026-11-20"), // open, due this week, this month
    order(2, "in_production", "2026-10-10", "2026-11-10"), // open, overdue
    order(3, "ready", "2026-10-20", "2026-11-22"), // open, due Sunday
    order(4, "quote", "2026-11-05", "2026-11-19"), // not open, not revenue
    order(5, "cancelled", "2026-11-06", "2026-11-19"), // not open, not revenue
    order(6, "delivered", "2026-11-03", "2026-11-12"), // revenue, not open
    order(7, "confirmed", "2026-10-30", "2026-11-23"), // open, next week
  ];

  it("counts open, due this week and overdue orders", () => {
    const kpis = computeKpis(orders, TODAY);
    expect(kpis.openOrders).toBe(4);
    expect(kpis.dueThisWeek).toBe(2);
    expect(kpis.overdue).toBe(1);
  });

  it("sums booked orders created this month", () => {
    const one = orderTotal(orders[0]!);
    expect(computeKpis(orders, TODAY).revenueThisMonth).toBe(one * 2);
  });
});

describe("weeklyOrderCounts", () => {
  it("returns the requested number of weeks ending with the current one", () => {
    const weeks = weeklyOrderCounts([], TODAY, 12);
    expect(weeks).toHaveLength(12);
    expect(weeks.at(-1)?.weekStart).toBe("2026-11-16");
    expect(weeks[0]?.weekStart).toBe("2026-08-31");
  });

  it("buckets by creation week and status, ignoring older orders", () => {
    const weeks = weeklyOrderCounts(
      [
        order(1, "quote", "2026-11-16", "2026-12-01"),
        order(2, "ready", "2026-11-18", "2026-12-01"),
        order(3, "ready", "2026-11-15", "2026-12-01"),
        order(4, "ready", "2025-01-01", "2025-02-01"),
      ],
      TODAY,
      2,
    );
    expect(weeks[1]).toMatchObject({ total: 2, counts: { quote: 1, ready: 1 } });
    expect(weeks[0]).toMatchObject({ total: 1, counts: { ready: 1 } });
  });
});
