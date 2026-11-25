import { describe, expect, it } from "vitest";
import { z } from "zod";
import { SupplierQuoteSchema } from "@/domain/supplier-quote";
import { toModelJsonSchema } from "./json-schema";

function collectKeys(node: unknown, keys = new Set<string>(), parent = ""): Set<string> {
  if (Array.isArray(node)) node.forEach((n) => collectKeys(n, keys, parent));
  else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (parent !== "properties") keys.add(key);
      collectKeys(value, keys, key);
    }
  }
  return keys;
}

describe("toModelJsonSchema", () => {
  it("drops keywords the model API does not support but keeps property names", () => {
    const schema = toModelJsonSchema(
      z.object({ pattern: z.string().regex(/^a/), amount: z.number().positive(), when: z.iso.date().nullable() }),
    ) as { properties: Record<string, unknown> };
    expect(Object.keys(schema.properties)).toEqual(["pattern", "amount", "when"]);
    const keys = collectKeys(schema);
    expect(keys.has("$schema")).toBe(false);
    expect(keys.has("exclusiveMinimum")).toBe(false);
    expect(keys.has("pattern")).toBe(false);
  });

  it("describes the supplier quote with value and confidence on every field", () => {
    const schema = toModelJsonSchema(SupplierQuoteSchema) as {
      required: string[];
      properties: { supplier: { properties: Record<string, unknown> } };
    };
    expect(schema.required).toEqual(["supplier", "quoteNumber", "date", "currency", "lines", "total"]);
    expect(Object.keys(schema.properties.supplier.properties)).toEqual(["value", "confidence"]);
  });
});
