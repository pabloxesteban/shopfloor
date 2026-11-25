import { describe, expect, it } from "vitest";
import { seedOrders } from "@/server/data/seed";
import { createSeededRepositories } from "@/server/repository";
import { computeKpis } from "./kpis";
import {
  activeQuickFilter,
  DEFAULT_ORDERS_QUERY,
  hasActiveFilters,
  ordersHref,
  parseOrdersQuery,
  quickFilterQuery,
  serializeOrdersQuery,
  toggleStatus,
} from "./orders-query";

describe("orders search params", () => {
  it("uses defaults for an empty URL", () => {
    expect(parseOrdersQuery({})).toEqual({
      q: "",
      status: [],
      priority: "all",
      dueFrom: undefined,
      dueTo: undefined,
      sort: "createdAt",
      dir: "desc",
      page: 1,
    });
  });

  it("parses every field", () => {
    const query = parseOrdersQuery({
      q: "  Benítez ",
      status: "ready,confirmed",
      priority: "urgent",
      dueFrom: "2026-11-01",
      dueTo: "2026-11-30",
      sort: "total",
      dir: "asc",
      page: "3",
    });
    expect(query).toEqual({
      q: "Benítez",
      // Canonical order, not URL order, so equal filters give equal URLs.
      status: ["confirmed", "ready"],
      priority: "urgent",
      dueFrom: "2026-11-01",
      dueTo: "2026-11-30",
      sort: "total",
      dir: "asc",
      page: 3,
    });
  });

  it("falls back per field on garbage instead of failing", () => {
    const query = parseOrdersQuery({
      status: "ready,shipped",
      priority: "asap",
      dueFrom: "yesterday",
      sort: "customer",
      dir: "sideways",
      page: "-4",
    });
    expect(query.status).toEqual(["ready"]);
    expect(query.priority).toBe("all");
    expect(query.dueFrom).toBeUndefined();
    expect(query.sort).toBe("createdAt");
    expect(query.dir).toBe("desc");
    expect(query.page).toBe(1);
  });

  it("takes the first value when a key is repeated", () => {
    expect(parseOrdersQuery({ priority: ["urgent", "normal"] }).priority).toBe("urgent");
  });

  it("reads URLSearchParams too", () => {
    expect(parseOrdersQuery(new URLSearchParams("q=ORD-1042&page=2"))).toMatchObject({ q: "ORD-1042", page: 2 });
  });

  it("serializes only non-default values", () => {
    expect(serializeOrdersQuery(DEFAULT_ORDERS_QUERY).toString()).toBe("");
    const params = serializeOrdersQuery({ ...DEFAULT_ORDERS_QUERY, status: ["quote", "ready"], page: 2 });
    expect(params.toString()).toBe("status=quote%2Cready&page=2");
  });

  it("round-trips through the URL", () => {
    const query = parseOrdersQuery({ q: "Quilmes", status: "in_production", sort: "dueDate", dir: "asc", page: "2" });
    expect(parseOrdersQuery(serializeOrdersQuery(query))).toEqual(query);
  });

  it("resets to page 1 when a filter changes, but not when paging", () => {
    const onPage3 = { ...DEFAULT_ORDERS_QUERY, page: 3 };
    expect(ordersHref(onPage3, { priority: "urgent" })).toBe("/orders?priority=urgent");
    expect(ordersHref(onPage3, { page: 4 })).toBe("/orders?page=4");
    expect(ordersHref(DEFAULT_ORDERS_QUERY)).toBe("/orders");
  });

  it("toggles statuses keeping canonical order", () => {
    expect(toggleStatus(["ready"], "quote")).toEqual(["quote", "ready"]);
    expect(toggleStatus(["quote", "ready"], "quote")).toEqual(["ready"]);
  });

  it("knows when filters are active", () => {
    expect(hasActiveFilters(DEFAULT_ORDERS_QUERY)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_ORDERS_QUERY, sort: "total", page: 4 })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_ORDERS_QUERY, dueTo: "2026-12-01" })).toBe(true);
  });
});

describe("quick filters", () => {
  const today = "2026-11-18";

  it("builds past due and this week queries", () => {
    const pastDue = quickFilterQuery("past_due", today);
    expect(pastDue.dueTo).toBe("2026-11-17");
    expect(pastDue.status).toEqual(["confirmed", "in_production", "ready"]);
    expect(pastDue.page).toBe(1);
    const week = quickFilterQuery("this_week", today);
    expect(week.dueFrom).toBe("2026-11-16");
    expect(week.dueTo).toBe("2026-11-22");
    expect(week.status).toEqual(["confirmed", "in_production", "ready"]);
  });

  it("builds the other chips from the default query", () => {
    expect(quickFilterQuery("all", today)).toEqual(DEFAULT_ORDERS_QUERY);
    expect(quickFilterQuery("urgent", today)).toEqual({ ...DEFAULT_ORDERS_QUERY, priority: "urgent" });
    expect(quickFilterQuery("in_production", today)).toEqual({ ...DEFAULT_ORDERS_QUERY, status: ["in_production"] });
  });

  it("detects the active chip, ignoring sort, direction and page", () => {
    expect(activeQuickFilter(DEFAULT_ORDERS_QUERY, today)).toBe("all");
    expect(activeQuickFilter({ ...quickFilterQuery("urgent", today), page: 3, sort: "total" }, today)).toBe("urgent");
    expect(activeQuickFilter({ ...DEFAULT_ORDERS_QUERY, q: "Sosa" }, today)).toBeNull();
  });

  it("matches the overdue KPI on the seed data", async () => {
    const orders = seedOrders({ today });
    const repos = createSeededRepositories(today);
    const page = await repos.orders.list(quickFilterQuery("past_due", today));
    expect(page.total).toBe(computeKpis(orders, today).overdue);
    const week = await repos.orders.list(quickFilterQuery("this_week", today));
    expect(week.total).toBe(computeKpis(orders, today).dueThisWeek);
  });
});
