import { describe, expect, it } from "vitest";
import {
  billableAreaCm2,
  GLASS_SURCHARGE_PER_M2,
  lineTotalCents,
  MIN_BILLABLE_AREA_CM2,
  orderTotalCents,
  PRICE_PER_M2,
  unitPriceCents,
  type PricedItem,
} from "./pricing";

const base: PricedItem = {
  productType: "sliding-window",
  series: "Modena",
  glass: "single",
  widthCm: 150,
  heightCm: 110,
  quantity: 1,
};

describe("pricing", () => {
  it("prices by area times the rate for the product type and series", () => {
    // 1.5 m x 1.1 m = 1.65 m²
    expect(unitPriceCents(base)).toBe(Math.round(1.65 * PRICE_PER_M2.Modena["sliding-window"]));
  });

  it("adds the glass surcharge per square meter", () => {
    const laminated = unitPriceCents({ ...base, glass: "laminated" });
    expect(laminated - unitPriceCents(base)).toBe(Math.round(1.65 * GLASS_SURCHARGE_PER_M2.laminated));
  });

  it("bills small pieces as 0.5 m²", () => {
    expect(billableAreaCm2(40, 40)).toBe(MIN_BILLABLE_AREA_CM2);
    expect(unitPriceCents({ ...base, widthCm: 40, heightCm: 40 })).toBe(
      unitPriceCents({ ...base, widthCm: 50, heightCm: 100 }),
    );
  });

  it("does not apply the minimum to pieces above 0.5 m²", () => {
    expect(billableAreaCm2(100, 60)).toBe(6_000);
  });

  it("returns integer cents", () => {
    const odd = unitPriceCents({ ...base, widthCm: 133, heightCm: 77, series: "A30", glass: "double-glazed" });
    expect(Number.isInteger(odd)).toBe(true);
  });

  it("multiplies by quantity and sums lines", () => {
    const line = { ...base, quantity: 3 };
    expect(lineTotalCents(line)).toBe(unitPriceCents(base) * 3);
    expect(orderTotalCents([line, base])).toBe(unitPriceCents(base) * 4);
    expect(orderTotalCents([])).toBe(0);
  });

  it("has a price for every series and product type", () => {
    for (const bySeries of Object.values(PRICE_PER_M2)) {
      for (const price of Object.values(bySeries)) {
        expect(price).toBeGreaterThan(0);
      }
    }
  });
});
