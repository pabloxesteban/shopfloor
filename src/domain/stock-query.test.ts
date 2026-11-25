import { describe, expect, it } from "vitest";
import { parseStockQuery } from "./stock-query";

describe("stock search params", () => {
  it("defaults to everything", () => {
    expect(parseStockQuery({})).toEqual({ category: undefined, lowOnly: false });
  });

  it("reads category and the low stock switch", () => {
    expect(parseStockQuery({ category: "glass", low: "1" })).toEqual({ category: "glass", lowOnly: true });
    expect(parseStockQuery({ low: "on" }).lowOnly).toBe(true);
  });

  it("ignores unknown categories", () => {
    expect(parseStockQuery({ category: "wood", low: "maybe" })).toEqual({ category: undefined, lowOnly: false });
  });
});
