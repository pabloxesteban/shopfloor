import type { Material } from "./material";
import type { PlainQuoteLine } from "./supplier-quote";

export type UnmatchedReason = "no_sku" | "unknown_sku" | "unit_mismatch";

export const UNMATCHED_REASON_LABELS: Record<UnmatchedReason, string> = {
  no_sku: "No SKU on the line",
  unknown_sku: "SKU not in our catalog",
  unit_mismatch: "Unit does not match the catalog",
};

export interface MatchedLine {
  line: PlainQuoteLine;
  material: Material;
}

export interface UnmatchedLine {
  line: PlainQuoteLine;
  reason: UnmatchedReason;
}

export interface MatchResult {
  matched: MatchedLine[];
  unmatched: UnmatchedLine[];
}

function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase();
}

/**
 * Splits quote lines into the ones we can book as incoming stock and the ones
 * we cannot. Every input line ends up in exactly one of the two lists, so
 * nothing is dropped without the user seeing it.
 */
export function matchQuoteLines(lines: readonly PlainQuoteLine[], materials: readonly Material[]): MatchResult {
  const bySku = new Map(materials.map((m) => [normalizeSku(m.sku), m]));
  const result: MatchResult = { matched: [], unmatched: [] };

  for (const line of lines) {
    if (!line.sku) {
      result.unmatched.push({ line, reason: "no_sku" });
      continue;
    }
    const material = bySku.get(normalizeSku(line.sku));
    if (!material) {
      result.unmatched.push({ line, reason: "unknown_sku" });
    } else if (material.unit !== line.unit) {
      result.unmatched.push({ line, reason: "unit_mismatch" });
    } else {
      result.matched.push({ line, material });
    }
  }
  return result;
}
