import { z } from "zod";
import { MaterialCategorySchema } from "./material";

/** Search params for the stock page: `?category=glass&low=1`. Bad values fall back to "all". */
export const StockQuerySchema = z.object({
  category: MaterialCategorySchema.optional().catch(undefined),
  lowOnly: z
    .string()
    .optional()
    .transform((value) => value === "1" || value === "on" || value === "true")
    .catch(false),
});
export type StockQuery = z.infer<typeof StockQuerySchema>;

export function parseStockQuery(raw: Record<string, string | string[] | undefined>): StockQuery {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  return StockQuerySchema.parse({ category: first(raw.category), lowOnly: first(raw.low) });
}
