import type { PlainQuote } from "@/domain/supplier-quote";

/**
 * Scores an extraction against ground truth, field by field.
 * - Numbers match when equal after rounding to cents.
 * - Text matches after normalising: case, accents, punctuation and repeated spaces are ignored.
 * - Enums and dates must match exactly.
 * Lines are compared by position; a missing or extra line counts against
 * `lineCount`, and every field of a missing line counts as a miss.
 */

export type ScoredField =
  | "supplier"
  | "quoteNumber"
  | "date"
  | "currency"
  | "total"
  | "lineCount"
  | "lines.description"
  | "lines.sku"
  | "lines.quantity"
  | "lines.unit"
  | "lines.unitPrice";

export const SCORED_FIELDS: readonly ScoredField[] = [
  "supplier",
  "quoteNumber",
  "date",
  "currency",
  "total",
  "lineCount",
  "lines.description",
  "lines.sku",
  "lines.quantity",
  "lines.unit",
  "lines.unitPrice",
];

export interface FieldCheck {
  field: ScoredField;
  path: string;
  expected: unknown;
  actual: unknown;
  match: boolean;
}

export interface SampleScore {
  sampleId: string;
  /** Set when the extraction itself failed; every field then counts as a miss. */
  error?: string;
  checks: FieldCheck[];
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    // Dots and apostrophes vanish ("S.R.L." equals "SRL"); other separators become spaces.
    .replace(/[.']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function textMatch(expected: string | null, actual: string | null | undefined): boolean {
  if (expected === null || actual === null || actual === undefined) return expected === (actual ?? null);
  return normalizeText(expected) === normalizeText(actual);
}

function numberMatch(expected: number, actual: number | undefined): boolean {
  return actual !== undefined && Math.round(expected * 100) === Math.round(actual * 100);
}

export function scoreQuote(sampleId: string, truth: PlainQuote, actual: PlainQuote | null, error?: string): SampleScore {
  const checks: FieldCheck[] = [];
  const add = (field: ScoredField, path: string, expected: unknown, value: unknown, match: boolean) =>
    checks.push({ field, path, expected, actual: value, match });

  add("supplier", "supplier", truth.supplier, actual?.supplier, actual ? textMatch(truth.supplier, actual.supplier) : false);
  add("quoteNumber", "quoteNumber", truth.quoteNumber, actual?.quoteNumber, actual ? textMatch(truth.quoteNumber, actual.quoteNumber) : false);
  add("date", "date", truth.date, actual?.date, actual ? truth.date === actual.date : false);
  add("currency", "currency", truth.currency, actual?.currency, actual ? truth.currency === actual.currency : false);
  add("total", "total", truth.total, actual?.total, numberMatch(truth.total, actual?.total));
  add("lineCount", "lines.length", truth.lines.length, actual?.lines.length, actual?.lines.length === truth.lines.length);

  truth.lines.forEach((expected, i) => {
    const got = actual?.lines[i];
    const p = (name: string) => `lines.${i}.${name}`;
    add("lines.description", p("description"), expected.description, got?.description, got ? textMatch(expected.description, got.description) : false);
    add("lines.sku", p("sku"), expected.sku, got?.sku, got ? textMatch(expected.sku, got.sku) : false);
    add("lines.quantity", p("quantity"), expected.quantity, got?.quantity, numberMatch(expected.quantity, got?.quantity));
    add("lines.unit", p("unit"), expected.unit, got?.unit, got ? expected.unit === got.unit : false);
    add("lines.unitPrice", p("unitPrice"), expected.unitPrice, got?.unitPrice, numberMatch(expected.unitPrice, got?.unitPrice));
  });

  return { sampleId, error, checks };
}

export interface FieldAccuracy {
  field: ScoredField;
  correct: number;
  total: number;
  accuracy: number;
}

export function accuracyByField(scores: readonly SampleScore[]): FieldAccuracy[] {
  return SCORED_FIELDS.map((field) => {
    const checks = scores.flatMap((s) => s.checks.filter((c) => c.field === field));
    const correct = checks.filter((c) => c.match).length;
    return { field, correct, total: checks.length, accuracy: checks.length ? correct / checks.length : 0 };
  });
}

export function overallAccuracy(scores: readonly SampleScore[]): { correct: number; total: number; accuracy: number } {
  const checks = scores.flatMap((s) => s.checks);
  const correct = checks.filter((c) => c.match).length;
  return { correct, total: checks.length, accuracy: checks.length ? correct / checks.length : 0 };
}

const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
const show = (value: unknown) => (value === undefined ? "(missing)" : JSON.stringify(value));

export function renderMarkdown(scores: readonly SampleScore[], meta: { model: string; runAt: string }): string {
  const overall = overallAccuracy(scores);
  const lines = [
    "# Extraction eval results",
    "",
    `Model: \`${meta.model}\`. Run at ${meta.runAt}. Samples: ${scores.length}.`,
    "",
    `Overall field accuracy: **${pct(overall.accuracy)}** (${overall.correct} of ${overall.total} fields).`,
    "",
    "| Field | Correct | Total | Accuracy |",
    "| --- | ---: | ---: | ---: |",
    ...accuracyByField(scores).map((f) => `| ${f.field} | ${f.correct} | ${f.total} | ${pct(f.accuracy)} |`),
    "",
    "## Failures",
    "",
  ];
  let failures = 0;
  for (const score of scores) {
    const misses = score.checks.filter((c) => !c.match);
    if (misses.length === 0 && !score.error) continue;
    failures += 1;
    lines.push(`### ${score.sampleId}`, "");
    if (score.error) lines.push(`Extraction failed: ${score.error}`, "");
    for (const miss of misses) {
      lines.push(`- \`${miss.path}\`: expected ${show(miss.expected)}, got ${show(miss.actual)}`);
    }
    lines.push("");
  }
  if (failures === 0) lines.push("None.", "");
  return lines.join("\n");
}
