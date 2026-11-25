import { describe, expect, it } from "vitest";
import type { PlainQuote } from "@/domain/supplier-quote";
import { accuracyByField, normalizeText, overallAccuracy, renderMarkdown, scoreQuote } from "./eval-score";

// Hand-built test inputs for the scorer. They are not model output.
const truth: PlainQuote = {
  supplier: "Perfiles Quillén S.R.L.",
  quoteNumber: "P-00412",
  date: "2026-11-10",
  currency: "ARS",
  total: 1_210_000.5,
  lines: [
    { description: "Marco corredizo Modena, barra 6 m", sku: "PRF-MOD-101", quantity: 24, unit: "bar-6m", unitPrice: 48_350 },
    { description: "Descuento comercial 5%", sku: null, quantity: 1, unit: "unit", unitPrice: -77_950 },
  ],
};

describe("normalizeText", () => {
  it("ignores case, accents, punctuation and spacing", () => {
    expect(normalizeText("  Perfiles QUILLEN srl ")).toBe(normalizeText("Perfiles Quillén S.R.L."));
    expect(normalizeText("PRF-MOD-101")).toBe(normalizeText("prf mod 101"));
  });
});

describe("scoreQuote", () => {
  it("scores a perfect extraction as all matches", () => {
    const score = scoreQuote("s1", truth, structuredClone(truth));
    expect(score.checks.every((c) => c.match)).toBe(true);
    expect(score.checks).toHaveLength(6 + 2 * 5);
  });

  it("accepts formatting differences in text and float noise in numbers", () => {
    const actual = structuredClone(truth);
    actual.supplier = "PERFILES QUILLEN SRL";
    actual.total = 1_210_000.499999;
    actual.lines[0]!.description = "marco corredizo modena barra 6m";
    const checks = scoreQuote("s1", truth, actual).checks;
    expect(checks.find((c) => c.path === "supplier")?.match).toBe(true);
    expect(checks.find((c) => c.path === "total")?.match).toBe(true);
    // "6 m" vs "6m" differ after normalisation: spacing inside words is meaningful.
    expect(checks.find((c) => c.path === "lines.0.description")?.match).toBe(false);
  });

  it("treats null and a value as different, and null and null as equal", () => {
    const actual = structuredClone(truth);
    actual.lines[1]!.sku = "DESC-5";
    actual.quoteNumber = null;
    const checks = scoreQuote("s1", truth, actual).checks;
    expect(checks.find((c) => c.path === "lines.1.sku")?.match).toBe(false);
    expect(checks.find((c) => c.path === "quoteNumber")?.match).toBe(false);
    const noNumber = { ...truth, quoteNumber: null };
    expect(scoreQuote("s2", noNumber, { ...noNumber }).checks.find((c) => c.path === "quoteNumber")?.match).toBe(true);
  });

  it("counts missing lines and wrong enums as misses", () => {
    const actual = { ...structuredClone(truth), currency: "USD" as const, lines: [structuredClone(truth.lines[0]!)] };
    const checks = scoreQuote("s1", truth, actual).checks;
    expect(checks.find((c) => c.path === "currency")?.match).toBe(false);
    expect(checks.find((c) => c.path === "lines.length")?.match).toBe(false);
    expect(checks.filter((c) => c.path.startsWith("lines.1.")).every((c) => !c.match)).toBe(true);
  });

  it("marks every field as a miss when extraction failed", () => {
    const score = scoreQuote("s1", truth, null, "invalid_output");
    expect(score.checks.every((c) => !c.match)).toBe(true);
    expect(score.error).toBe("invalid_output");
  });
});

describe("aggregation and report", () => {
  const perfect = scoreQuote("a", truth, structuredClone(truth));
  const failed = scoreQuote("b", truth, null, "model_error");

  it("computes accuracy per field and overall", () => {
    const sku = accuracyByField([perfect, failed]).find((f) => f.field === "lines.sku");
    expect(sku).toEqual({ field: "lines.sku", correct: 2, total: 4, accuracy: 0.5 });
    expect(overallAccuracy([perfect, failed]).accuracy).toBe(0.5);
  });

  it("renders a markdown table and lists failures", () => {
    const md = renderMarkdown([perfect, failed], { model: "test-model", runAt: "2026-11-20T10:00:00.000Z" });
    expect(md).toContain("| supplier | 1 | 2 | 50.0% |");
    expect(md).toContain("### b");
    expect(md).toContain("Extraction failed: model_error");
    expect(md).not.toContain("### a");
  });
});
