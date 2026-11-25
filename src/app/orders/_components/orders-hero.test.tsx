// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BUSINESS_TODAY } from "@/domain/dates";
import type { OrderKpis, WeekBucket } from "@/domain/kpis";
import { ordersHref, quickFilterQuery } from "@/domain/orders-query";
import { compactMoney, OrdersHero } from "./orders-hero";

const kpis = (patch: Partial<OrderKpis> = {}): OrderKpis => ({
  openOrders: 42,
  dueThisWeek: 9,
  overdue: 7,
  revenueThisMonth: 2120744750,
  ...patch,
});

const weeks: WeekBucket[] = [
  {
    weekStart: "2026-11-09",
    total: 6,
    counts: { quote: 1, confirmed: 2, in_production: 2, ready: 1, delivered: 0, cancelled: 0 },
  },
];

describe("OrdersHero", () => {
  it("shows the overdue count as the hero figure, linked to the past due filter", () => {
    render(<OrdersHero kpis={kpis()} weeks={weeks} />);
    const link = screen.getByRole("link", { name: /7 orders past due/i });
    expect(link).toHaveAttribute("href", ordersHref(quickFilterQuery("past_due", BUSINESS_TODAY)));
    expect(link).toHaveAttribute("href", expect.stringContaining("dueTo=2026-11-17"));
    expect(screen.getByTestId("signal-dot")).toBeInTheDocument();
  });

  it("uses the singular label for one order", () => {
    render(<OrdersHero kpis={kpis({ overdue: 1 })} weeks={weeks} />);
    expect(screen.getByText("order past due")).toBeInTheDocument();
  });

  it("is calm when nothing is overdue", () => {
    render(<OrdersHero kpis={kpis({ overdue: 0 })} weeks={weeks} />);
    expect(screen.getByText("No orders past due")).toBeInTheDocument();
    expect(screen.queryByTestId("signal-dot")).toBeNull();
    expect(screen.queryByRole("link", { name: /past due/i })).toBeNull();
  });

  it("shows the secondary figures", () => {
    render(<OrdersHero kpis={kpis()} weeks={weeks} />);
    expect(screen.getByText("Booked this month").previousElementSibling).toHaveTextContent("ARS 21.2M");
    expect(screen.getByText("Open orders")).toBeInTheDocument();
    expect(screen.getByText("Due this week")).toBeInTheDocument();
    expect(screen.getByText("Booked this month")).toBeInTheDocument();
  });

  it("keeps an accessible table for the chart", () => {
    render(<OrdersHero kpis={kpis()} weeks={weeks} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});

describe("compactMoney", () => {
  it("abbreviates millions", () => {
    expect(compactMoney(2120744750)).toBe("ARS 21.2M");
  });
  it("abbreviates thousands and keeps small amounts whole", () => {
    expect(compactMoney(85000000)).toBe("ARS 850K");
    expect(compactMoney(12345)).toBe("ARS 123");
  });
});
