import { z } from "zod";

/**
 * Keywords the Gemini `responseJsonSchema` option understands. Anything else
 * (patterns, exclusive bounds, $schema) is removed rather than sent, because
 * an unsupported keyword can make the request fail. The zod schema still
 * enforces every rule when the response comes back.
 */
const SUPPORTED_KEYWORDS = new Set([
  "$id",
  "$defs",
  "$ref",
  "$anchor",
  "type",
  "format",
  "title",
  "description",
  "enum",
  "items",
  "prefixItems",
  "minItems",
  "maxItems",
  "minimum",
  "maximum",
  "anyOf",
  "oneOf",
  "properties",
  "additionalProperties",
  "required",
  "propertyOrdering",
]);

/** Keys of these objects are user property names, not keywords, so keep them all. */
const NAME_MAPS = new Set(["properties", "$defs"]);

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

function strip(node: Json): Json {
  if (Array.isArray(node)) return node.map(strip);
  if (node === null || typeof node !== "object") return node;
  const out: { [key: string]: Json } = {};
  for (const [key, value] of Object.entries(node)) {
    if (!SUPPORTED_KEYWORDS.has(key)) continue;
    if (NAME_MAPS.has(key) && value !== null && typeof value === "object" && !Array.isArray(value)) {
      out[key] = Object.fromEntries(Object.entries(value).map(([name, child]) => [name, strip(child)]));
    } else {
      out[key] = strip(value);
    }
  }
  return out;
}

export function toModelJsonSchema(schema: z.ZodType): Json {
  return strip(z.toJSONSchema(schema, { target: "draft-2020-12", io: "output" }) as Json);
}
