import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { linesTotal, PlainQuoteSchema } from "@/domain/supplier-quote";
import { SAMPLE_QUOTES } from "@/server/ai/samples";

describe("ground truth fixtures", () => {
  it.each(SAMPLE_QUOTES.map((s) => s.id))("%s is a valid quote whose total equals its lines", async (id) => {
    const json: unknown = JSON.parse(await readFile(path.join(process.cwd(), "fixtures/truth", `${id}.json`), "utf8"));
    const truth = PlainQuoteSchema.parse(json);
    expect(linesTotal(truth.lines)).toBe(truth.total);
  });
});
