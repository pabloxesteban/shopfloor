import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { extractWith, type ExtractionResult, type Generate, type QuoteDocument } from "./extract-quote";

/**
 * Demo mode replays real model responses saved by `pnpm ai:record`. The
 * replay goes through the same validation and retry code as a live call, so a
 * recording that needed a retry live needs it here too.
 */
export const RecordingSchema = z.object({
  sampleId: z.string(),
  model: z.string(),
  recordedAt: z.iso.datetime(),
  /** Raw text of each model answer, in order. Never edited by hand. */
  responses: z.array(z.string()).min(1),
});
export type Recording = z.infer<typeof RecordingSchema>;

export function recordingPath(sampleId: string, root = process.cwd()): string {
  return path.join(root, "fixtures", "recorded", `${sampleId}.json`);
}

export async function loadRecording(sampleId: string, root?: string): Promise<Recording | undefined> {
  let text: string;
  try {
    text = await readFile(recordingPath(sampleId, root), "utf8");
  } catch {
    return undefined;
  }
  const parsed = RecordingSchema.safeParse(JSON.parse(text));
  return parsed.success && parsed.data.sampleId === sampleId ? parsed.data : undefined;
}

export function replay(recording: Recording): Generate {
  let index = 0;
  return async () => {
    const response = recording.responses[index++];
    if (response === undefined) throw new Error("The recording has no more responses to replay");
    return response;
  };
}

export async function extractFromRecording(recording: Recording, document: QuoteDocument): Promise<ExtractionResult> {
  return extractWith(replay(recording), document);
}
