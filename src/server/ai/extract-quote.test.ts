import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * The Gemini SDK is mocked: no network, no key. `answers` holds the raw text
 * the fake model returns on each call. These strings are hand-written test
 * inputs for the validation and retry logic, not recorded model output.
 */
const answers: Array<string | Error> = [];
const calls: Array<{ model: string; prompt: string; config: Record<string, unknown> }> = [];

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = {
      generateContent: async (request: {
        model: string;
        contents: Array<{ parts: Array<{ text?: string }> }>;
        config: Record<string, unknown>;
      }) => {
        const prompt = request.contents[0]?.parts.find((p) => p.text)?.text ?? "";
        calls.push({ model: request.model, prompt, config: request.config });
        const next = answers.shift();
        if (next instanceof Error) throw next;
        return { text: next };
      },
    };
  },
}));

const { extractQuote, validateModelOutput, DEFAULT_GEMINI_MODEL } = await import("./extract-quote");

const c = <T,>(value: T, confidence = 0.9) => ({ value, confidence });
const validAnswer = JSON.stringify({
  supplier: c("Herrajes Calandria S.A."),
  quoteNumber: c("R-118"),
  date: c("2026-11-14"),
  currency: c("ARS"),
  total: c(887_000),
  lines: [
    { description: c("Rodamientos"), sku: c("HDW-RLR-02"), quantity: c(80), unit: c("unit"), unitPrice: c(3_850) },
    { description: c("Cerradura"), sku: c("HDW-LCK-MP", 0.5), quantity: c(6), unit: c("unit"), unitPrice: c(96_500) },
  ],
});
const document = { data: new Uint8Array([37, 80, 68, 70]), mimeType: "application/pdf" as const };

describe("extractQuote", () => {
  beforeEach(() => {
    answers.length = 0;
    calls.length = 0;
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_MODEL", "");
  });

  it("returns a typed quote when the first answer is valid", async () => {
    answers.push(validAnswer);
    const result = await extractQuote(document);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.attempts).toBe(1);
    expect(result.quote.lines[1]?.sku).toEqual({ value: "HDW-LCK-MP", confidence: 0.5 });
    expect(calls[0]?.model).toBe(DEFAULT_GEMINI_MODEL);
    expect(calls[0]?.config).toMatchObject({ responseMimeType: "application/json", temperature: 0 });
    expect(calls[0]?.config.responseJsonSchema).toBeTypeOf("object");
  });

  it("uses GEMINI_MODEL when set", async () => {
    vi.stubEnv("GEMINI_MODEL", "some-other-model");
    answers.push(validAnswer);
    await extractQuote(document);
    expect(calls[0]?.model).toBe("some-other-model");
  });

  it("retries once with the validation errors in the prompt", async () => {
    const broken = JSON.parse(validAnswer) as { currency: { value: string } };
    broken.currency.value = "EUR";
    answers.push(JSON.stringify(broken), validAnswer);

    const result = await extractQuote(document);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.attempts).toBe(2);
    expect(result.responses).toHaveLength(2);
    expect(calls).toHaveLength(2);
    expect(calls[1]?.prompt).toContain("did not match the schema");
    expect(calls[1]?.prompt).toContain("currency.value");
  });

  it("gives up after a second invalid answer with a typed error", async () => {
    answers.push("not json at all", JSON.stringify({ supplier: c("") }));
    const result = await extractQuote(document);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("invalid_output");
    expect(result.problems.length).toBeGreaterThan(0);
    expect(calls).toHaveLength(2);
  });

  it("turns SDK failures into a model_error without retrying", async () => {
    answers.push(new Error("503 overloaded"));
    const result = await extractQuote(document);
    expect(result).toMatchObject({ ok: false, code: "model_error", problems: ["503 overloaded"] });
    expect(calls).toHaveLength(1);
  });

  it("does not call the SDK without an API key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const result = await extractQuote(document);
    expect(result).toMatchObject({ ok: false, code: "not_configured" });
    expect(calls).toHaveLength(0);
  });
});

describe("validateModelOutput", () => {
  it("rejects confidence outside 0..1 and reports the path", () => {
    const bad = JSON.parse(validAnswer) as { total: { confidence: number } };
    bad.total.confidence = 7;
    const result = validateModelOutput(JSON.stringify(bad));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems.join(" ")).toContain("total.confidence");
  });
});
