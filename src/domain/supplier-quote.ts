import { z } from "zod";
import { IsoDateSchema } from "./dates";
import { MaterialUnitSchema } from "./material";
import { CURRENCIES } from "./money";

/**
 * A supplier quote exists in two shapes:
 * - `PlainQuote`: just the values. Used for ground truth and for what the user confirms.
 * - `SupplierQuote`: what the extraction returns. Every field carries the
 *   model's own confidence (0..1) so the review screen knows what to flag.
 */

export const CONFIDENCE_THRESHOLD = 0.8;

export const CurrencySchema = z.enum(CURRENCIES);

const text = z.string().trim().min(1);

export const PlainQuoteLineSchema = z.object({
  description: text,
  sku: text.nullable(),
  quantity: z.number().positive(),
  unit: MaterialUnitSchema,
  /** Decimal amount in the quote currency. Discount lines are negative. */
  unitPrice: z.number(),
});
export type PlainQuoteLine = z.infer<typeof PlainQuoteLineSchema>;

export const PlainQuoteSchema = z.object({
  supplier: text,
  quoteNumber: text.nullable(),
  date: IsoDateSchema.nullable(),
  currency: CurrencySchema,
  lines: z.array(PlainQuoteLineSchema).min(1),
  total: z.number(),
});
export type PlainQuote = z.infer<typeof PlainQuoteSchema>;

const Confidence = z.number().min(0).max(1);

function withConfidence<T extends z.ZodType>(value: T) {
  return z.object({ value, confidence: Confidence });
}

export const SupplierQuoteLineSchema = z.object({
  description: withConfidence(PlainQuoteLineSchema.shape.description),
  sku: withConfidence(PlainQuoteLineSchema.shape.sku),
  quantity: withConfidence(PlainQuoteLineSchema.shape.quantity),
  unit: withConfidence(PlainQuoteLineSchema.shape.unit),
  unitPrice: withConfidence(PlainQuoteLineSchema.shape.unitPrice),
});
export type SupplierQuoteLine = z.infer<typeof SupplierQuoteLineSchema>;

export const SupplierQuoteSchema = z.object({
  supplier: withConfidence(PlainQuoteSchema.shape.supplier),
  quoteNumber: withConfidence(PlainQuoteSchema.shape.quoteNumber),
  date: withConfidence(PlainQuoteSchema.shape.date),
  currency: withConfidence(PlainQuoteSchema.shape.currency),
  lines: z.array(SupplierQuoteLineSchema).min(1),
  total: withConfidence(PlainQuoteSchema.shape.total),
});
export type SupplierQuote = z.infer<typeof SupplierQuoteSchema>;

export const QUOTE_FIELDS = ["supplier", "quoteNumber", "date", "currency", "total"] as const;
export type QuoteField = (typeof QUOTE_FIELDS)[number];
export const LINE_FIELDS = ["description", "sku", "quantity", "unit", "unitPrice"] as const;
export type LineField = (typeof LINE_FIELDS)[number];

export function toPlainQuote(quote: SupplierQuote): PlainQuote {
  return {
    supplier: quote.supplier.value,
    quoteNumber: quote.quoteNumber.value,
    date: quote.date.value,
    currency: quote.currency.value,
    total: quote.total.value,
    lines: quote.lines.map((line) => ({
      description: line.description.value,
      sku: line.sku.value,
      quantity: line.quantity.value,
      unit: line.unit.value,
      unitPrice: line.unitPrice.value,
    })),
  };
}

/** Paths (`supplier`, `lines.2.sku`) whose confidence is under the threshold. */
export function lowConfidencePaths(quote: SupplierQuote, threshold = CONFIDENCE_THRESHOLD): string[] {
  const paths: string[] = [];
  for (const field of QUOTE_FIELDS) {
    if (quote[field].confidence < threshold) paths.push(field);
  }
  quote.lines.forEach((line, index) => {
    for (const field of LINE_FIELDS) {
      if (line[field].confidence < threshold) paths.push(`lines.${index}.${field}`);
    }
  });
  return paths;
}

/** Sum of the lines, rounded to cents. Used to warn when it disagrees with the printed total. */
export function linesTotal(lines: readonly Pick<PlainQuoteLine, "quantity" | "unitPrice">[]): number {
  const cents = lines.reduce((sum, line) => sum + Math.round(line.quantity * line.unitPrice * 100), 0);
  return cents / 100;
}

/**
 * What the user sends back after reviewing: the corrected values plus the
 * list of low-confidence paths they explicitly checked. The server refuses
 * the import if any flagged path is missing from `confirmedPaths`.
 */
export const ReviewedQuoteSchema = z.object({
  quote: PlainQuoteSchema,
  flaggedPaths: z.array(z.string()),
  confirmedPaths: z.array(z.string()),
});
export type ReviewedQuote = z.infer<typeof ReviewedQuoteSchema>;

export function unconfirmedPaths(review: Pick<ReviewedQuote, "flaggedPaths" | "confirmedPaths">): string[] {
  const confirmed = new Set(review.confirmedPaths);
  return review.flaggedPaths.filter((path) => !confirmed.has(path));
}
