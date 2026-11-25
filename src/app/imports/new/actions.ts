"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { UNMATCHED_REASON_LABELS, matchQuoteLines } from "@/domain/matching";
import { addIncoming, type Material } from "@/domain/material";
import { lowConfidencePaths, PlainQuoteSchema, unconfirmedPaths } from "@/domain/supplier-quote";
import {
  ACCEPTED_MIME_TYPES,
  extractQuote,
  geminiModel,
  isLiveExtractionConfigured,
  type QuoteDocument,
  type QuoteMimeType,
} from "@/server/ai/extract-quote";
import { createRateLimiter } from "@/server/ai/rate-limit";
import { extractFromRecording, loadRecording } from "@/server/ai/recordings";
import { findSample } from "@/server/ai/samples";
import { completePendingImport, getPendingImport, registerPendingImport } from "@/server/pending-imports";
import { getRepositories } from "@/server/repository";
import { MAX_UPLOAD_BYTES, type ConfirmState, type ExtractState } from "./import-state";

const limiterStore = globalThis as typeof globalThis & { __shopfloorLimiter?: ReturnType<typeof createRateLimiter> };
const limiter = (limiterStore.__shopfloorLimiter ??= createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 }));

function fail(code: string, message: string, detail?: string): ExtractState {
  return { status: "error", code, message, detail };
}

/** Checks the first bytes too: the browser-reported type is only a claim. */
function sniffMimeType(bytes: Uint8Array): QuoteMimeType | undefined {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts(0x25, 0x50, 0x44, 0x46)) return "application/pdf";
  if (starts(0x89, 0x50, 0x4e, 0x47)) return "image/png";
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  return undefined;
}

async function clientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

async function readSource(
  formData: FormData,
): Promise<{ document: QuoteDocument; sampleId?: string; label: string } | ExtractState> {
  const source = formData.get("source");
  if (source === "sample") {
    const sample = findSample(String(formData.get("sampleId") ?? ""));
    if (!sample) return fail("bad_input", "Choose one of the bundled samples.");
    const data = await readFile(path.join(process.cwd(), "public", "samples", `${sample.id}.pdf`));
    return { document: { data, mimeType: "application/pdf" }, sampleId: sample.id, label: sample.label };
  }
  if (source === "upload") {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return fail("bad_input", "Choose a PDF, JPG or PNG file to upload.");
    if (file.size > MAX_UPLOAD_BYTES) return fail("too_large", "The file is larger than 5 MB.");
    const data = new Uint8Array(await file.arrayBuffer());
    const mimeType = sniffMimeType(data);
    if (!mimeType || !(ACCEPTED_MIME_TYPES as readonly string[]).includes(mimeType)) {
      return fail("bad_type", "Only PDF, JPG and PNG files can be imported.");
    }
    return { document: { data, mimeType }, label: file.name };
  }
  return fail("bad_input", "Choose a sample or upload a file.");
}

export async function extractQuoteAction(_previous: ExtractState, formData: FormData): Promise<ExtractState> {
  const input = await readSource(formData);
  if ("status" in input) return input;

  if (!isLiveExtractionConfigured()) {
    if (!input.sampleId) {
      return fail(
        "demo_upload",
        "Uploads need live extraction, which is not configured on this server.",
        "Pick one of the bundled samples instead.",
      );
    }
    const recording = await loadRecording(input.sampleId);
    if (!recording) {
      return fail(
        "no_recording",
        "No recorded response for this sample yet",
        "Demo mode only replays real model responses. They are created by running pnpm ai:record with an API key.",
      );
    }
    const result = await extractFromRecording(recording, input.document);
    if (!result.ok) return fail(result.code, result.message, result.problems.slice(0, 5).join("; "));
    const flaggedPaths = lowConfidencePaths(result.quote);
    return {
      status: "review",
      importId: registerPendingImport(flaggedPaths),
      quote: result.quote,
      flaggedPaths,
      source: "recorded",
      model: recording.model,
      recordedAt: recording.recordedAt,
      documentLabel: input.label,
    };
  }

  const limit = limiter.check(await clientKey());
  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterMs / 60_000);
    return fail("rate_limited", `Too many extractions. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`);
  }

  const result = await extractQuote(input.document);
  if (!result.ok) return fail(result.code, result.message, result.problems.slice(0, 5).join("; "));
  const flaggedPaths = lowConfidencePaths(result.quote);
  return {
    status: "review",
    importId: registerPendingImport(flaggedPaths),
    quote: result.quote,
    flaggedPaths,
    source: "live",
    model: geminiModel(),
    documentLabel: input.label,
  };
}

const ReviewPayloadSchema = z.object({
  importId: z.string().min(1),
  quote: PlainQuoteSchema,
  confirmedPaths: z.array(z.string()),
});

export async function confirmImportAction(_previous: ConfirmState, formData: FormData): Promise<ConfirmState> {
  let json: unknown;
  try {
    json = JSON.parse(String(formData.get("review") ?? ""));
  } catch {
    return { status: "error", message: "The review could not be read. Start the import again." };
  }
  const payload = ReviewPayloadSchema.safeParse(json);
  if (!payload.success) return { status: "error", message: "Some values are not valid. Check the highlighted fields." };

  const pending = getPendingImport(payload.data.importId);
  if (!pending) return { status: "error", message: "This review expired or was already imported. Start the import again." };

  const missing = unconfirmedPaths({ flaggedPaths: pending.flaggedPaths, confirmedPaths: payload.data.confirmedPaths });
  if (missing.length > 0) {
    return { status: "error", message: `Check every flagged field before importing (${missing.length} left).` };
  }

  const { quote } = payload.data;
  const materials = getRepositories().materials;
  const { matched, unmatched } = matchQuoteLines(quote.lines, await materials.list());

  // Several lines can point at the same SKU; add them up before saving.
  const updated = new Map<string, Material>();
  for (const { line, material } of matched) {
    const current = updated.get(material.sku) ?? material;
    updated.set(material.sku, addIncoming(current, line.quantity));
  }
  await materials.saveMany([...updated.values()]);
  completePendingImport(payload.data.importId);
  revalidatePath("/stock");

  return {
    status: "done",
    supplier: quote.supplier,
    quoteNumber: quote.quoteNumber,
    matched: matched.map(({ line, material }) => ({
      sku: material.sku,
      name: material.name,
      quantity: line.quantity,
      unit: material.unit,
      incomingNow: updated.get(material.sku)?.incoming ?? material.incoming,
    })),
    unmatched: unmatched.map(({ line, reason }) => ({
      description: line.description,
      sku: line.sku,
      quantity: line.quantity,
      reason: UNMATCHED_REASON_LABELS[reason],
    })),
  };
}
