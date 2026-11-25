import { z } from "zod";
import { addDays, IsoDateSchema, startOfWeek } from "./dates";
import { isOpen, ORDER_STATUSES, type OrderStatus } from "./status";

/**
 * The orders list keeps every filter, sort and page in the URL. This module
 * is the only place that reads or writes those search params, so the server
 * page, the filter bar and the pagination links cannot disagree.
 */

export const PAGE_SIZE = 20;
export const SORT_FIELDS = ["createdAt", "dueDate", "total"] as const;
export type SortField = (typeof SORT_FIELDS)[number];
export const SORT_LABELS: Record<SortField, string> = {
  createdAt: "Created",
  dueDate: "Due date",
  total: "Total",
};

export const PRIORITY_FILTERS = ["all", "normal", "urgent"] as const;

const statusList = z.preprocess(
  (value) => (typeof value === "string" ? value.split(",") : []),
  z.array(z.string()).transform((values) => ORDER_STATUSES.filter((status) => values.includes(status))),
);

/**
 * Every field has a `.catch()` fallback: a hand-edited or stale URL degrades
 * to sensible defaults instead of an error page.
 */
export const OrdersQuerySchema = z.object({
  q: z.string().trim().max(80).catch(""),
  status: statusList.catch([]),
  priority: z.enum(PRIORITY_FILTERS).catch("all"),
  dueFrom: IsoDateSchema.optional().catch(undefined),
  dueTo: IsoDateSchema.optional().catch(undefined),
  sort: z.enum(SORT_FIELDS).catch("createdAt"),
  dir: z.enum(["asc", "desc"]).catch("desc"),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});
export type OrdersQuery = z.infer<typeof OrdersQuerySchema>;

export const DEFAULT_ORDERS_QUERY: OrdersQuery = OrdersQuerySchema.parse({});

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

export function parseOrdersQuery(raw: RawParams): OrdersQuery {
  const read = (key: string): string | undefined => {
    if (raw instanceof URLSearchParams) return raw.get(key) ?? undefined;
    const value = raw[key];
    return Array.isArray(value) ? value[0] : value;
  };
  return OrdersQuerySchema.parse({
    q: read("q"),
    status: read("status"),
    priority: read("priority"),
    dueFrom: read("dueFrom"),
    dueTo: read("dueTo"),
    sort: read("sort"),
    dir: read("dir"),
    page: read("page"),
  });
}

/** Writes only the values that differ from the defaults, in a stable order. */
export function serializeOrdersQuery(query: OrdersQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status.length > 0) params.set("status", query.status.join(","));
  if (query.priority !== "all") params.set("priority", query.priority);
  if (query.dueFrom) params.set("dueFrom", query.dueFrom);
  if (query.dueTo) params.set("dueTo", query.dueTo);
  if (query.sort !== DEFAULT_ORDERS_QUERY.sort) params.set("sort", query.sort);
  if (query.dir !== DEFAULT_ORDERS_QUERY.dir) params.set("dir", query.dir);
  if (query.page > 1) params.set("page", String(query.page));
  return params;
}

/**
 * Link to the orders list with some fields changed. Any change other than the
 * page itself sends the user back to page 1, because the old page number
 * usually points past the end of the new result set.
 */
export function ordersHref(query: OrdersQuery, patch: Partial<OrdersQuery> = {}): string {
  const next: OrdersQuery = { ...query, ...patch };
  if (!("page" in patch)) next.page = 1;
  const search = serializeOrdersQuery(next).toString();
  return search ? `/orders?${search}` : "/orders";
}

export function toggleStatus(statuses: readonly OrderStatus[], status: OrderStatus): OrderStatus[] {
  const set = new Set(statuses);
  if (set.has(status)) set.delete(status);
  else set.add(status);
  return ORDER_STATUSES.filter((s) => set.has(s));
}

export function hasActiveFilters(query: OrdersQuery): boolean {
  return Boolean(query.q || query.status.length || query.priority !== "all" || query.dueFrom || query.dueTo);
}

export type QuickFilterKey = "all" | "past_due" | "this_week" | "urgent" | "in_production";

export const QUICK_FILTER_KEYS: readonly QuickFilterKey[] = ["all", "past_due", "this_week", "urgent", "in_production"];

/** Open statuses (not delivered, cancelled or still a quote), as `isOpen` defines them. */
const OPEN_STATUSES: readonly OrderStatus[] = ORDER_STATUSES.filter(isOpen);

/** A chip owns its fields and drops every other filter. Always lands on page 1. */
export function quickFilterQuery(key: QuickFilterKey, today: string): OrdersQuery {
  const base: OrdersQuery = { ...DEFAULT_ORDERS_QUERY };
  switch (key) {
    case "past_due":
      return { ...base, status: [...OPEN_STATUSES], dueTo: addDays(today, -1) };
    case "this_week": {
      const weekStart = startOfWeek(today);
      return { ...base, status: [...OPEN_STATUSES], dueFrom: weekStart, dueTo: addDays(weekStart, 6) };
    }
    case "urgent":
      return { ...base, priority: "urgent" };
    case "in_production":
      return { ...base, status: ["in_production"] };
    case "all":
      return base;
  }
}

/** The chip whose query equals `query`, ignoring sort, direction and page. */
export function activeQuickFilter(query: OrdersQuery, today: string): QuickFilterKey | null {
  const same = (a: OrdersQuery, b: OrdersQuery): boolean =>
    a.q === b.q &&
    a.priority === b.priority &&
    a.dueFrom === b.dueFrom &&
    a.dueTo === b.dueTo &&
    a.status.length === b.status.length &&
    a.status.every((status, i) => status === b.status[i]);
  return QUICK_FILTER_KEYS.find((key) => same(query, quickFilterQuery(key, today))) ?? null;
}
