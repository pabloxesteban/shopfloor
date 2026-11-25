import { z } from "zod";

export const MATERIAL_CATEGORIES = ["profile", "glass", "hardware"] as const;
export const MaterialCategorySchema = z.enum(MATERIAL_CATEGORIES);
export type MaterialCategory = z.infer<typeof MaterialCategorySchema>;

export const MATERIAL_UNITS = ["bar-6m", "m2", "unit"] as const;
export const MaterialUnitSchema = z.enum(MATERIAL_UNITS);
export type MaterialUnit = z.infer<typeof MaterialUnitSchema>;

export const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  profile: "Profiles",
  glass: "Glass",
  hardware: "Hardware",
};

export const UNIT_LABELS: Record<MaterialUnit, string> = {
  "bar-6m": "6 m bar",
  m2: "m²",
  unit: "unit",
};

const quantity = z.number().min(0);

export const MaterialSchema = z.object({
  sku: z.string().regex(/^[A-Z]{3}-[A-Z0-9-]+$/),
  name: z.string().min(2),
  category: MaterialCategorySchema,
  unit: MaterialUnitSchema,
  onHand: quantity,
  reserved: quantity,
  incoming: quantity,
  reorderPoint: quantity,
});
export type Material = z.infer<typeof MaterialSchema>;

type StockLevels = Pick<Material, "onHand" | "reserved" | "incoming" | "reorderPoint">;

/** Stock that is physically here and not promised to an order. */
export function available(material: StockLevels): number {
  return material.onHand - material.reserved;
}

/** Low when even counting what is on the way we would fall under the reorder point. */
export function isLow(material: StockLevels): boolean {
  return available(material) + material.incoming < material.reorderPoint;
}

/** Quantities can be fractional (m² of glass), so round for display and storage. */
export function roundQuantity(value: number): number {
  return Math.round(value * 100) / 100;
}

export function addIncoming(material: Material, quantity: number): Material {
  return { ...material, incoming: roundQuantity(material.incoming + quantity) };
}
