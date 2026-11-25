import { COLORS, GLASS_TYPES, PRODUCT_TYPES, SERIES } from "@/domain/catalog";
import { addDays, daysBetween } from "@/domain/dates";
import type { Material } from "@/domain/material";
import type { Order, OrderItem } from "@/domain/order";
import type { OrderStatus } from "@/domain/status";
import { MATERIAL_CATALOG } from "./materials";
import { createRandom, type Random } from "./prng";

const FIRST_NAMES = [
  "Lucía", "Martín", "Sofía", "Julián", "Valentina", "Tomás", "Camila", "Joaquín", "Florencia", "Matías",
  "Agustina", "Facundo", "Micaela", "Nicolás", "Rocío", "Gonzalo", "Carolina", "Diego", "Paula", "Federico",
];
const LAST_NAMES = [
  "Benítez", "Ferreyra", "Gutiérrez", "Sosa", "Acosta", "Romero", "Medina", "Herrera", "Aguirre", "Pereyra",
  "Giménez", "Molina", "Castro", "Ojeda", "Ledesma", "Villalba", "Quiroga", "Correa", "Ibarra", "Maidana",
];
/** Invented business names. Any resemblance to a real company is accidental. */
const BUSINESSES = [
  "Obras Pampa Norte", "Estudio Arquitectura Calden", "Construcciones Tala Seca", "Reformas Ombú y Asociados",
  "Desarrollos Cina Cina", "Grupo Constructor Espinillo",
];
const TOWNS = [
  "Morón", "Ramos Mejía", "Haedo", "Castelar", "Ituzaingó", "Lanús", "Banfield", "Lomas de Zamora",
  "Adrogué", "Temperley", "Quilmes", "Bernal", "San Isidro", "Martínez", "Tigre", "Pilar",
];
const NOTES = [
  "Customer prefers delivery in the morning.",
  "Second floor, check access for large panes.",
  "Measurements confirmed on site.",
  "Replace existing wooden frames.",
  "Call before delivery.",
  "Matching color with existing windows on the front.",
];

const SIZE_RANGES: Record<OrderItem["productType"], { w: [number, number]; h: [number, number] }> = {
  "sliding-window": { w: [100, 240], h: [90, 150] },
  "casement-window": { w: [50, 120], h: [60, 150] },
  "tilt-turn-window": { w: [60, 130], h: [90, 160] },
  door: { w: [80, 160], h: [200, 240] },
  "fixed-panel": { w: [40, 200], h: [40, 220] },
};

function fictionalPhone(random: Random): string {
  // "11 00xx" is not an assigned range in Buenos Aires, so these numbers cannot reach anyone.
  return `11 00${random.int(10, 99)}-${random.int(1000, 9999)}`;
}

function randomItem(random: Random): OrderItem {
  const productType = random.pick(PRODUCT_TYPES);
  const size = SIZE_RANGES[productType];
  return {
    productType,
    series: random.pick(SERIES),
    widthCm: random.int(size.w[0] / 5, size.w[1] / 5) * 5,
    heightCm: random.int(size.h[0] / 5, size.h[1] / 5) * 5,
    glass: random.pick(GLASS_TYPES),
    color: random.pick(COLORS),
    quantity: random.chance(0.6) ? 1 : random.int(2, 6),
  };
}

/**
 * Status follows the due date: work due long ago is delivered, work due soon
 * is in production or ready, work due far ahead is still a quote or just
 * confirmed. A few orders run late so the overdue KPI has something to show.
 */
function statusFor(random: Random, daysToDue: number): OrderStatus {
  if (random.chance(0.05)) return "cancelled";
  if (daysToDue < -7) return random.chance(0.97) ? "delivered" : "ready";
  if (daysToDue < 0) return random.pick(["delivered", "delivered", "delivered", "ready", "in_production"] as const);
  if (daysToDue < 10) return random.pick(["in_production", "in_production", "ready", "ready", "confirmed"] as const);
  if (daysToDue <= 25) return random.pick(["quote", "confirmed", "confirmed", "in_production", "in_production"] as const);
  return random.pick(["quote", "quote", "confirmed", "confirmed", "in_production"] as const);
}

export interface SeedOptions {
  today: string;
  orderCount?: number;
  seed?: number;
}

export function seedOrders({ today, orderCount = 120, seed = 3 }: SeedOptions): Order[] {
  const random = createRandom(seed);
  const spanDays = 182;
  const firstDay = addDays(today, -spanDays);

  // Skewed towards recent weeks (the shop is growing), then sorted so ids
  // grow with time like a real ledger.
  const createdOffsets = Array.from({ length: orderCount }, () => Math.round(spanDays * random.next() ** 0.6)).sort(
    (a, b) => a - b,
  );

  return createdOffsets.map((offset, index) => {
    const createdOn = addDays(firstDay, offset);
    const dueDate = addDays(createdOn, random.int(14, 45));
    const status = statusFor(random, daysBetween(today, dueDate));
    const isBusiness = random.chance(0.2);
    const itemCount = random.chance(0.5) ? 1 : random.int(2, 5);

    const order: Order = {
      id: `ORD-${1001 + index}`,
      customer: {
        name: isBusiness
          ? random.pick(BUSINESSES)
          : `${random.pick(FIRST_NAMES)} ${random.pick(LAST_NAMES)}`,
        phone: random.chance(0.8) ? fictionalPhone(random) : undefined,
        town: random.pick(TOWNS),
      },
      status,
      priority: random.chance(0.18) ? "urgent" : "normal",
      items: Array.from({ length: itemCount }, () => randomItem(random)),
      createdAt: `${createdOn}T${String(random.int(8, 18)).padStart(2, "0")}:${String(random.int(0, 59)).padStart(2, "0")}:00.000Z`,
      dueDate,
      notes: random.chance(0.25) ? random.pick(NOTES) : undefined,
    };
    return order;
  });
}

/** A handful of SKUs are pinned low so the stock screen always has something to show. */
const PINNED_LOW = new Set(["GLS-LAM-33", "HDW-RLR-02", "PRF-MOD-101", "HDW-LCK-MP", "GLS-DVH-4-12-4"]);

export function seedMaterials(seed = 7): Material[] {
  const random = createRandom(seed);
  return MATERIAL_CATALOG.map(([sku, name, category, unit]) => {
    const reorderPoint = unit === "unit" ? random.int(10, 40) : random.int(15, 40);
    const low = PINNED_LOW.has(sku);
    const reserved = random.int(2, Math.round(reorderPoint * 0.8));
    const onHand = low
      ? reserved + random.int(0, Math.round(reorderPoint * 0.4))
      : reserved + reorderPoint + random.int(5, 60);
    return {
      sku,
      name,
      category,
      unit,
      onHand,
      reserved,
      incoming: low ? 0 : random.chance(0.3) ? random.int(5, 20) : 0,
      reorderPoint,
    };
  });
}
