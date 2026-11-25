import { z } from "zod";

export const PRODUCT_TYPES = [
  "sliding-window",
  "casement-window",
  "tilt-turn-window",
  "door",
  "fixed-panel",
] as const;
export const ProductTypeSchema = z.enum(PRODUCT_TYPES, { error: "Choose a product type" });
export type ProductType = z.infer<typeof ProductTypeSchema>;

/** Aluminum profile lines, from the economy line to the thermal-break line. */
export const SERIES = ["Herrero", "Modena", "A30"] as const;
export const SeriesSchema = z.enum(SERIES, { error: "Choose a series" });
export type Series = z.infer<typeof SeriesSchema>;

export const GLASS_TYPES = ["single", "laminated", "double-glazed"] as const;
export const GlassSchema = z.enum(GLASS_TYPES, { error: "Choose a glass type" });
export type Glass = z.infer<typeof GlassSchema>;

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  "sliding-window": "Sliding window",
  "casement-window": "Casement window",
  "tilt-turn-window": "Tilt and turn window",
  door: "Door",
  "fixed-panel": "Fixed panel",
};

export const GLASS_LABELS: Record<Glass, string> = {
  single: "Single 4 mm",
  laminated: "Laminated 3+3",
  "double-glazed": "Double glazed",
};

export const COLORS = ["White", "Black", "Bronze", "Natural anodized", "Wood finish"] as const;
