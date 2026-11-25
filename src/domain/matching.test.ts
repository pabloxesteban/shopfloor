import { describe, expect, it } from "vitest";
import { matchQuoteLines } from "./matching";
import type { Material } from "./material";
import type { PlainQuoteLine } from "./supplier-quote";

const materials: Material[] = [
  { sku: "PRF-MOD-101", name: "Modena frame", category: "profile", unit: "bar-6m", onHand: 10, reserved: 2, incoming: 0, reorderPoint: 5 },
  { sku: "GLS-LAM-33", name: "Laminated 3+3", category: "glass", unit: "m2", onHand: 10, reserved: 2, incoming: 0, reorderPoint: 5 },
];

const line = (sku: string | null, unit: PlainQuoteLine["unit"] = "bar-6m"): PlainQuoteLine => ({
  description: "line",
  sku,
  quantity: 2,
  unit,
  unitPrice: 100,
});

describe("matchQuoteLines", () => {
  it("matches by SKU ignoring case and spaces", () => {
    const result = matchQuoteLines([line(" prf-mod-101 ")], materials);
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0]?.material.sku).toBe("PRF-MOD-101");
  });

  it("explains every line it cannot match", () => {
    const result = matchQuoteLines([line(null), line("XYZ-000"), line("GLS-LAM-33", "unit")], materials);
    expect(result.matched).toHaveLength(0);
    expect(result.unmatched.map((u) => u.reason)).toEqual(["no_sku", "unknown_sku", "unit_mismatch"]);
  });

  it("never drops a line", () => {
    const lines = [line("PRF-MOD-101"), line(null), line("GLS-LAM-33", "m2"), line("NOPE-1")];
    const result = matchQuoteLines(lines, materials);
    expect(result.matched.length + result.unmatched.length).toBe(lines.length);
  });
});
