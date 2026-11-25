/**
 * Runs extraction over every bundled sample and scores it against ground truth.
 *
 *   GEMINI_API_KEY=... pnpm ai:eval              # live calls
 *   pnpm ai:eval --recorded                      # score saved recordings, no network
 *
 * Writes evals/results.md (readable) and evals/results.json (raw checks).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PlainQuoteSchema, toPlainQuote } from "../src/domain/supplier-quote";
import { accuracyByField, overallAccuracy, renderMarkdown, scoreQuote, type SampleScore } from "../src/server/ai/eval-score";
import { createGeminiGenerate, extractWith, geminiModel, type ExtractionResult } from "../src/server/ai/extract-quote";
import { extractFromRecording, loadRecording } from "../src/server/ai/recordings";
import { SAMPLE_QUOTES, samplePdfPath } from "../src/server/ai/samples";

const ROOT = path.resolve(import.meta.dirname, "..");
const PAUSE_MS = 4_000;

async function main() {
  const useRecordings = process.argv.includes("--recorded");
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!useRecordings && !apiKey) {
    console.error("GEMINI_API_KEY is not set. Set it to run live, or use --recorded to score saved recordings.");
    process.exit(1);
  }
  const generate = apiKey ? createGeminiGenerate(apiKey, geminiModel()) : undefined;
  const scores: SampleScore[] = [];
  const models = new Set<string>();

  for (const [index, sample] of SAMPLE_QUOTES.entries()) {
    const truth = PlainQuoteSchema.parse(JSON.parse(await readFile(path.join(ROOT, "fixtures/truth", `${sample.id}.json`), "utf8")));
    const document = { data: await readFile(path.join(ROOT, samplePdfPath(sample.id))), mimeType: "application/pdf" as const };

    let result: ExtractionResult;
    if (useRecordings) {
      const recording = await loadRecording(sample.id, ROOT);
      if (!recording) {
        console.log(`${sample.id}: no recording, skipped`);
        continue;
      }
      models.add(recording.model);
      result = await extractFromRecording(recording, document);
    } else {
      if (index > 0) await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
      models.add(geminiModel());
      result = await extractWith(generate!, document);
    }

    const score = result.ok
      ? scoreQuote(sample.id, truth, toPlainQuote(result.quote))
      : scoreQuote(sample.id, truth, null, `${result.code}: ${result.message}`);
    scores.push(score);
    const correct = score.checks.filter((c) => c.match).length;
    console.log(`${sample.id}: ${correct}/${score.checks.length} fields${score.error ? ` (${score.error})` : ""}`);
  }

  if (scores.length === 0) {
    console.error("Nothing was scored.");
    process.exit(1);
  }

  const runAt = new Date().toISOString();
  const model = [...models].join(", ") + (useRecordings ? " (from recordings)" : "");
  await mkdir(path.join(ROOT, "evals"), { recursive: true });
  await writeFile(path.join(ROOT, "evals/results.md"), renderMarkdown(scores, { model, runAt }));
  await writeFile(
    path.join(ROOT, "evals/results.json"),
    `${JSON.stringify({ model, runAt, overall: overallAccuracy(scores), fields: accuracyByField(scores), scores }, null, 2)}\n`,
  );
  const overall = overallAccuracy(scores);
  console.log(`\nOverall: ${(overall.accuracy * 100).toFixed(1)}% of ${overall.total} fields. Wrote evals/results.md`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
