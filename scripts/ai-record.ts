/**
 * Records real Gemini responses for the bundled samples so demo mode can
 * replay them without an API key.
 *
 *   GEMINI_API_KEY=... pnpm ai:record            # all samples
 *   GEMINI_API_KEY=... pnpm ai:record <id> ...   # some samples
 *
 * Writes fixtures/recorded/<id>.json with the raw text of every model answer,
 * exactly as received. Do not edit these files by hand: demo mode presents
 * them as recorded model output.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createGeminiGenerate, extractWith, geminiModel } from "../src/server/ai/extract-quote";
import type { Recording } from "../src/server/ai/recordings";
import { SAMPLE_QUOTES, samplePdfPath } from "../src/server/ai/samples";

const ROOT = path.resolve(import.meta.dirname, "..");
const PAUSE_MS = 4_000;

async function main() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set. Add it to .env.local or the environment, then run again.");
    process.exit(1);
  }
  const model = geminiModel();
  const requested = process.argv.slice(2);
  const samples = requested.length ? SAMPLE_QUOTES.filter((s) => requested.includes(s.id)) : SAMPLE_QUOTES;
  if (samples.length === 0) {
    console.error(`No matching samples. Known ids: ${SAMPLE_QUOTES.map((s) => s.id).join(", ")}`);
    process.exit(1);
  }

  const generate = createGeminiGenerate(apiKey, model);
  await mkdir(path.join(ROOT, "fixtures/recorded"), { recursive: true });

  for (const [index, sample] of samples.entries()) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
    const data = await readFile(path.join(ROOT, samplePdfPath(sample.id)));
    const result = await extractWith(generate, { data, mimeType: "application/pdf" });
    if (result.responses.length === 0) {
      console.log(`${sample.id}: no response (${result.ok ? "" : result.message}), nothing recorded`);
      continue;
    }
    const recording: Recording = {
      sampleId: sample.id,
      model,
      recordedAt: new Date().toISOString(),
      responses: result.responses,
    };
    await writeFile(path.join(ROOT, "fixtures/recorded", `${sample.id}.json`), `${JSON.stringify(recording, null, 2)}\n`);
    console.log(`${sample.id}: ${result.ok ? `valid after ${result.attempts} attempt(s)` : `recorded, but ${result.code}`}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
