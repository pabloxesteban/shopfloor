import { describe, expect, it } from "vitest";
import {
  linesTotal,
  lowConfidencePaths,
  PlainQuoteSchema,
  SupplierQuoteSchema,
  toPlainQuote,
  unconfirmedPaths,
  type SupplierQuote,
} from "./supplier-quote";

const c = <T,>(value: T, confidence = 0.95) => ({ value, confidence });

// Hand-built test input for the schema helpers. Not model output.
const quote: SupplierQuote = {
  supplier: c("Perfiles Quillén S.R.L."),
  quoteNumber: c("P-00412", 0.6),
  date: c("2026-11-10"),
  currency: c("ARS" as const),
  total: c(250_000),
  lines: [
    {
      description: c("Marco Modena"),
      sku: c("PRF-MOD-101", 0.4),
      quantity: c(10),
      unit: c("bar-6m" as const),
      unitPrice: c(25_000),
    },
  ],
};

describe("supplier quote schemas", () => {
  it("accepts a well formed extraction", () => {
    expect(SupplierQuoteSchema.safeParse(quote).success).toBe(true);
  });

  it("rejects confidence outside 0..1 and unknown units", () => {
    expect(SupplierQuoteSchema.safeParse({ ...quote, supplier: c("X", 1.2) }).success).toBe(false);
    const badLine = { ...quote.lines[0], unit: c("box") };
    expect(SupplierQuoteSchema.safeParse({ ...quote, lines: [badLine] }).success).toBe(false);
  });

  it("requires at least one line and a positive quantity", () => {
    expect(PlainQuoteSchema.safeParse({ ...toPlainQuote(quote), lines: [] }).success).toBe(false);
    const plain = toPlainQuote(quote);
    const zeroQty = { ...plain, lines: [{ ...plain.lines[0], quantity: 0 }] };
    expect(PlainQuoteSchema.safeParse(zeroQty).success).toBe(false);
  });

  it("strips confidences", () => {
    expect(toPlainQuote(quote)).toEqual({
      supplier: "Perfiles Quillén S.R.L.",
      quoteNumber: "P-00412",
      date: "2026-11-10",
      currency: "ARS",
      total: 250_000,
      lines: [{ description: "Marco Modena", sku: "PRF-MOD-101", quantity: 10, unit: "bar-6m", unitPrice: 25_000 }],
    });
  });

  it("lists fields under the confidence threshold", () => {
    expect(lowConfidencePaths(quote)).toEqual(["quoteNumber", "lines.0.sku"]);
    expect(lowConfidencePaths(quote, 0.3)).toEqual([]);
  });

  it("reports which flagged fields are still unconfirmed", () => {
    expect(unconfirmedPaths({ flaggedPaths: ["a", "b"], confirmedPaths: ["b", "c"] })).toEqual(["a"]);
  });

  it("sums lines in cents to avoid float drift", () => {
    expect(linesTotal([{ quantity: 3, unitPrice: 0.1 }, { quantity: 1, unitPrice: -0.05 }])).toBe(0.25);
  });
});
