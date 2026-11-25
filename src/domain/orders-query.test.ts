import { describe, expect, it } from "vitest";
import {
  DEFAULT_ORDERS_QUERY,
  hasActiveFilters,
  ordersHref,
  parseOrdersQuery,
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
