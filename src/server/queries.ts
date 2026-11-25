import "server-only";
import { io } from "next/cache";
import { BUSINESS_TODAY } from "@/domain/dates";
import { computeKpis, weeklyOrderCounts } from "@/domain/kpis";
import type { OrdersQuery } from "@/domain/orders-query";
import { getRepositories, type MaterialFilter } from "./repository";

/*
 * Read helpers for Server Components. The store is in memory and answers
 * synchronously, which Next.js would otherwise treat as static and bake into
 * the build. `io()` marks each read as request-time so pages always show the
 * current state after a mutation.
 */

export async function getOrdersPage(query: OrdersQuery) {
  await io();
  return getRepositories().orders.list(query);
}

export async function getOrder(id: string) {
  await io();
  return getRepositories().orders.get(id);
}

export async function getOrderStats() {
  await io();
  const orders = await getRepositories().orders.all();
  return {
    kpis: computeKpis(orders, BUSINESS_TODAY),
    weeks: weeklyOrderCounts(orders, BUSINESS_TODAY, 12),
  };
}

export async function getMaterials(filter: MaterialFilter) {
  await io();
  return getRepositories().materials.list(filter);
}
