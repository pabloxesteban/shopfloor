import { BUSINESS_TODAY } from "@/domain/dates";
import { isLow, type Material, type MaterialCategory } from "@/domain/material";
import { orderTotal, type Order, type Priority } from "@/domain/order";
import { PAGE_SIZE, type OrdersQuery } from "@/domain/orders-query";
import type { OrderStatus } from "@/domain/status";
import { seedMaterials, seedOrders } from "./data/seed";

/**
 * Storage interfaces. The app only talks to these, so swapping the in-memory
 * implementation for a database one would not touch pages or actions.
 */

export interface OrderSummary {
  id: string;
  customerName: string;
  town: string;
  status: OrderStatus;
  priority: Priority;
  createdAt: string;
  dueDate: string;
  itemCount: number;
  totalCents: number;
}

export interface OrdersPage {
  rows: OrderSummary[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
}

export interface OrderRepository {
  list(query: OrdersQuery): Promise<OrdersPage>;
  all(): Promise<Order[]>;
  get(id: string): Promise<Order | undefined>;
  save(order: Order): Promise<Order>;
}

export interface MaterialFilter {
  category?: MaterialCategory;
  lowOnly?: boolean;
}

export interface MaterialRepository {
  list(filter?: MaterialFilter): Promise<Material[]>;
  get(sku: string): Promise<Material | undefined>;
  saveMany(materials: readonly Material[]): Promise<void>;
}

/** Lowercase and strip accents so "benitez" finds "Benítez". */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function toSummary(order: Order): OrderSummary {
  return {
    id: order.id,
    customerName: order.customer.name,
    town: order.customer.town,
    status: order.status,
    priority: order.priority,
    createdAt: order.createdAt,
    dueDate: order.dueDate,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    totalCents: orderTotal(order),
  };
}

function matches(order: OrderSummary, query: OrdersQuery): boolean {
  if (query.q) {
    const needle = normalize(query.q);
    const inId = normalize(order.id).includes(needle);
    if (!inId && !normalize(order.customerName).includes(needle)) return false;
  }
  if (query.status.length > 0 && !query.status.includes(order.status)) return false;
  if (query.priority !== "all" && order.priority !== query.priority) return false;
  if (query.dueFrom && order.dueDate < query.dueFrom) return false;
  if (query.dueTo && order.dueDate > query.dueTo) return false;
  return true;
}

function compare(a: OrderSummary, b: OrderSummary, query: OrdersQuery): number {
  const field = query.sort === "total" ? "totalCents" : query.sort;
  const left = a[field];
  const right = b[field];
  const primary = left < right ? -1 : left > right ? 1 : 0;
  // Tie-break on id so pages never shuffle between requests.
  const result = primary !== 0 ? primary : a.id.localeCompare(b.id);
  return query.dir === "asc" ? result : -result;
}

export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();

  constructor(seed: readonly Order[]) {
    for (const order of seed) this.orders.set(order.id, structuredClone(order));
  }

  async list(query: OrdersQuery): Promise<OrdersPage> {
    const rows = [...this.orders.values()].map(toSummary).filter((row) => matches(row, query));
    rows.sort((a, b) => compare(a, b, query));
    const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const page = Math.min(query.page, pageCount);
    return {
      rows: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      total: rows.length,
      page,
      pageCount,
      pageSize: PAGE_SIZE,
    };
  }

  async all(): Promise<Order[]> {
    return [...this.orders.values()].map((order) => structuredClone(order));
  }

  async get(id: string): Promise<Order | undefined> {
    const order = this.orders.get(id.toUpperCase());
    return order ? structuredClone(order) : undefined;
  }

  async save(order: Order): Promise<Order> {
    this.orders.set(order.id, structuredClone(order));
    return structuredClone(order);
  }
}

export class InMemoryMaterialRepository implements MaterialRepository {
  private readonly materials = new Map<string, Material>();

  constructor(seed: readonly Material[]) {
    for (const material of seed) this.materials.set(material.sku, { ...material });
  }

  async list(filter: MaterialFilter = {}): Promise<Material[]> {
    return [...this.materials.values()]
      .filter((m) => !filter.category || m.category === filter.category)
      .filter((m) => !filter.lowOnly || isLow(m))
      .map((m) => ({ ...m }));
  }

  async get(sku: string): Promise<Material | undefined> {
    const material = this.materials.get(sku.trim().toUpperCase());
    return material ? { ...material } : undefined;
  }

  async saveMany(materials: readonly Material[]): Promise<void> {
    for (const material of materials) this.materials.set(material.sku, { ...material });
  }
}

export interface Repositories {
  orders: OrderRepository;
  materials: MaterialRepository;
}

export function createSeededRepositories(today = BUSINESS_TODAY): Repositories {
  return {
    orders: new InMemoryOrderRepository(seedOrders({ today })),
    materials: new InMemoryMaterialRepository(seedMaterials()),
  };
}

/**
 * One store per server process. It lives on globalThis because Next.js can
 * load this module more than once (dev reloads, separate route bundles), and
 * each copy must see the same data. Restarting the server resets everything.
 */
const globalStore = globalThis as typeof globalThis & { __shopfloorRepositories?: Repositories };

export function getRepositories(): Repositories {
  globalStore.__shopfloorRepositories ??= createSeededRepositories();
  return globalStore.__shopfloorRepositories;
}
