import type { Glass, ProductType, Series } from "./catalog";
import type { Cents } from "./money";

/**
 * Price per square meter, in ARS cents, for each series and product type.
 * Typed as a full matrix so every combination has a price and a missing one
 * is a compile error rather than a runtime surprise. Fictional prices.
 */
export const PRICE_PER_M2: Record<Series, Record<ProductType, Cents>> = {
  Herrero: {
    "sliding-window": 160_000_00,
    "casement-window": 175_000_00,
    "tilt-turn-window": 230_000_00,
    door: 210_000_00,
    "fixed-panel": 120_000_00,
  },
  Modena: {
    "sliding-window": 215_000_00,
    "casement-window": 236_000_00,
    "tilt-turn-window": 310_000_00,
    door: 284_000_00,
    "fixed-panel": 162_000_00,
  },
  A30: {
    "sliding-window": 272_000_00,
    "casement-window": 298_000_00,
    "tilt-turn-window": 391_000_00,
    door: 357_000_00,
    "fixed-panel": 204_000_00,
  },
};

/** Extra cost per square meter for the glass, in ARS cents. */
export const GLASS_SURCHARGE_PER_M2: Record<Glass, Cents> = {
  single: 0,
  laminated: 38_000_00,
  "double-glazed": 72_000_00,
};

/** Small pieces are billed as if they were 0.5 m² (5,000 cm²). */
export const MIN_BILLABLE_AREA_CM2 = 5_000;

const CM2_PER_M2 = 10_000;

export interface PricedItem {
  productType: ProductType;
  series: Series;
  glass: Glass;
  widthCm: number;
  heightCm: number;
  quantity: number;
}

export function billableAreaCm2(widthCm: number, heightCm: number): number {
  return Math.max(widthCm * heightCm, MIN_BILLABLE_AREA_CM2);
}

export function unitPriceCents(item: PricedItem): Cents {
  const perM2 = PRICE_PER_M2[item.series][item.productType] + GLASS_SURCHARGE_PER_M2[item.glass];
  // Area stays in cm² until the last step so rounding happens once.
  return Math.round((billableAreaCm2(item.widthCm, item.heightCm) * perM2) / CM2_PER_M2);
}

export function lineTotalCents(item: PricedItem): Cents {
  return unitPriceCents(item) * item.quantity;
}

export function orderTotalCents(items: readonly PricedItem[]): Cents {
  return items.reduce((sum, item) => sum + lineTotalCents(item), 0);
}
