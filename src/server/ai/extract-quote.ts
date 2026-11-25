import "server-only";
import { GoogleGenAI } from "@google/genai";
import { SupplierQuoteSchema, type SupplierQuote } from "@/domain/supplier-quote";
import { toModelJsonSchema } from "./json-schema";
import { EXTRACTION_PROMPT, retryPrompt } from "./prompt";

export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

export const ACCEPTED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"] as const;
export type QuoteMimeType = (typeof ACCEPTED_MIME_TYPES)[number];

export interface QuoteDocument {
  data: Uint8Array;
  mimeType: QuoteMimeType;
}

/** Anything that turns a document plus instructions into raw model text. */
export type Generate = (input: { document: QuoteDocument; prompt: string }) => Promise<string>;

export type ExtractionErrorCode = "invalid_output" | "model_error" | "not_configured";

export type ExtractionResult =
  | { ok: true; quote: SupplierQuote; attempts: number; responses: string[] }
  | { ok: false; code: ExtractionErrorCode; message: string; problems: string[]; responses: string[] };

const MAX_ATTEMPTS = 2;

export function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

export function isLiveExtractionConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

const RESPONSE_SCHEMA = toModelJsonSchema(SupplierQuoteSchema);

export function createGeminiGenerate(apiKey: string, model: string): Generate {
  const ai = new GoogleGenAI({ apiKey });
  return async ({ document, prompt }) => {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: document.mimeType, data: Buffer.from(document.data).toString("base64") } },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: RESPONSE_SCHEMA,
        temperature: 0,
      },
    });
    const text = response.text;
    if (!text) throw new Error("The model returned an empty response");
    return text;
  };
}

type Validation = { ok: true; quote: SupplierQuote } | { ok: false; problems: string[] };

/** Model output is untrusted until zod says otherwise. */
export function validateModelOutput(text: string): Validation {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, problems: ["The answer was not valid JSON."] };
  }
  const parsed = SupplierQuoteSchema.safeParse(json);
  if (parsed.success) return { ok: true, quote: parsed.data };
  return {
    ok: false,
    problems: parsed.error.issues.slice(0, 20).map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`),
  };
}

/**
 * Asks once, validates, and if the answer does not fit the schema asks one
 * more time with the validation errors attached. A second failure is
 * returned as a typed error rather than thrown, so the UI can explain it.
 */
export async function extractWith(generate: Generate, document: QuoteDocument): Promise<ExtractionResult> {
  const responses: string[] = [];
  let problems: string[] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const prompt = attempt === 1 ? EXTRACTION_PROMPT : retryPrompt(problems);
    let text: string;
    try {
      text = await generate({ document, prompt });
    } catch (error) {
      return {
        ok: false,
        code: "model_error",
        message: "The extraction service did not answer. Try again in a minute.",
        problems: [error instanceof Error ? error.message : String(error)],
        responses,
      };
    }
    responses.push(text);
    const result = validateModelOutput(text);
    if (result.ok) return { ok: true, quote: result.quote, attempts: attempt, responses };
    problems = result.problems;
  }

  return {
    ok: false,
    code: "invalid_output",
    message: "The document was read, but the result did not pass validation twice. Nothing was imported.",
    problems,
    responses,
  };
}

/** Live extraction with Gemini. Requires GEMINI_API_KEY on the server. */
export async function extractQuote(document: QuoteDocument): Promise<ExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      code: "not_configured",
      message: "Live extraction is not configured on this server.",
      problems: [],
      responses: [],
    };
  }
  return extractWith(createGeminiGenerate(apiKey, geminiModel()), document);
}
