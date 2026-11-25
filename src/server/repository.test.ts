import { beforeEach, describe, expect, it } from "vitest";
import { isLow } from "@/domain/material";
import { orderTotal } from "@/domain/order";
import { DEFAULT_ORDERS_QUERY, PAGE_SIZE, type OrdersQuery } from "@/domain/orders-query";
import { seedMaterials, seedOrders } from "./data/seed";
import { createSeededRepositories, type Repositories } from "./repository";

const TODAY = "2026-11-18";
const query = (patch: Partial<OrdersQuery> = {}): OrdersQuery => ({ ...DEFAULT_ORDERS_QUERY, ...patch });

describe("seed data", () => {
  it("is deterministic", () => {
    expect(seedOrders({ today: TODAY })).toEqual(seedOrders({ today: TODAY }));
    expect(seedMaterials()).toEqual(seedMaterials());
  });

  it("has about 120 orders over six months, none in the future", () => {
    const orders = seedOrders({ today: TODAY });
    expect(orders).toHaveLength(120);
    const created = orders.map((o) => o.createdAt.slice(0, 10)).sort();
    expect(created[0]! >= "2026-05-01").toBe(true);
    expect(created.at(-1)! <= TODAY).toBe(true);
    expect(new Set(orders.map((o) => o.id)).size).toBe(120);
  });

  it("covers every status and has some overdue open orders", () => {
    const orders = seedOrders({ today: TODAY });
    const statuses = new Set(orders.map((o) => o.status));
    expect(statuses.size).toBe(6);
    const overdue = orders.filter((o) => ["confirmed", "in_production", "ready"].includes(o.status) && o.dueDate < TODAY);
    expect(overdue.length).toBeGreaterThan(0);
  });

  it("has about 30 materials with a few low ones", () => {
    const materials = seedMaterials();
    expect(materials.length).toBeGreaterThanOrEqual(28);
    const low = materials.filter(isLow).length;
    expect(low).toBeGreaterThanOrEqual(3);
    expect(low).toBeLessThan(10);
  });
});

describe("in-memory order repository", () => {
  let repos: Repositories;
  beforeEach(() => {
    repos = createSeededRepositories(TODAY);
  });

  it("paginates on the server", async () => {
    const first = await repos.orders.list(query());
    expect(first.rows).toHaveLength(PAGE_SIZE);
    expect(first.total).toBe(120);
    expect(first.pageCount).toBe(6);
    const last = await repos.orders.list(query({ page: 6 }));
    expect(last.rows).toHaveLength(20);
    expect(new Set([...first.rows, ...last.rows].map((r) => r.id)).size).toBe(40);
  });

  it("clamps a page past the end to the last page", async () => {
    const page = await repos.orders.list(query({ page: 99 }));
    expect(page.page).toBe(6);
    expect(page.rows.length).toBeGreaterThan(0);
  });

  it("searches by id and by customer name without accents", async () => {
    expect((await repos.orders.list(query({ q: "ord-1042" }))).rows.map((r) => r.id)).toEqual(["ORD-1042"]);
    const all = await repos.orders.all();
    const withAccent = all.find((o) => /[áéíóú]/.test(o.customer.name));
    expect(withAccent).toBeDefined();
    const plain = withAccent!.customer.name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    const found = await repos.orders.list(query({ q: plain }));
    expect(found.rows.map((r) => r.id)).toContain(withAccent!.id);
  });

  it("filters by status, priority and due date range", async () => {
    const result = await repos.orders.list(
      query({ status: ["confirmed", "in_production"], priority: "urgent", dueFrom: "2026-11-01", dueTo: "2026-12-31" }),
    );
    expect(result.total).toBeGreaterThan(0);
    for (const row of result.rows) {
      expect(["confirmed", "in_production"]).toContain(row.status);
      expect(row.priority).toBe("urgent");
      expect(row.dueDate >= "2026-11-01" && row.dueDate <= "2026-12-31").toBe(true);
    }
  });

  it("sorts by total in both directions with a stable tie-break", async () => {
    const asc = (await repos.orders.list(query({ sort: "total", dir: "asc" }))).rows.map((r) => r.totalCents);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = (await repos.orders.list(query({ sort: "dueDate", dir: "desc" }))).rows.map((r) => r.dueDate);
    expect(desc).toEqual([...desc].sort().reverse());
  });

  it("returns copies, so callers cannot mutate the store by accident", async () => {
    const order = await repos.orders.get("ORD-1001");
    order!.customer.name = "Changed";
    expect((await repos.orders.get("ORD-1001"))!.customer.name).not.toBe("Changed");
  });

  it("saves changes and reflects them in the computed total", async () => {
    const order = (await repos.orders.get("ORD-1001"))!;
    const before = orderTotal(order);
    order.items = order.items.map((item) => ({ ...item, quantity: item.quantity + 1 }));
    await repos.orders.save(order);
    const row = (await repos.orders.list(query({ q: "ORD-1001" }))).rows[0]!;
    expect(row.totalCents).toBeGreaterThan(before);
  });
});

describe("in-memory material repository", () => {
  it("filters by category and low stock", async () => {
    const repos = createSeededRepositories(TODAY);
    const glass = await repos.materials.list({ category: "glass" });
    expect(glass.every((m) => m.category === "glass")).toBe(true);
    const low = await repos.materials.list({ lowOnly: true });
    expect(low.every(isLow)).toBe(true);
  });

  it("finds by SKU case-insensitively and saves updates", async () => {
    const repos = createSeededRepositories(TODAY);
    const roller = (await repos.materials.get("hdw-rlr-02"))!;
    await repos.materials.saveMany([{ ...roller, incoming: roller.incoming + 50 }]);
    expect((await repos.materials.get("HDW-RLR-02"))!.incoming).toBe(roller.incoming + 50);
  });
});
