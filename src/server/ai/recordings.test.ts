import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SAMPLE_QUOTES } from "./samples";
import { extractFromRecording, loadRecording } from "./recordings";

const document = { data: new Uint8Array([1]), mimeType: "application/pdf" as const };

async function tempRoot(files: Record<string, unknown>) {
  const root = await mkdtemp(path.join(tmpdir(), "shopfloor-rec-"));
  await mkdir(path.join(root, "fixtures", "recorded"), { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    await writeFile(path.join(root, "fixtures", "recorded", `${name}.json`), JSON.stringify(content));
  }
  return root;
}

describe("recordings", () => {
  it("returns undefined when a sample has no recording yet", async () => {
    const root = await tempRoot({});
    expect(await loadRecording("perfiles-quillen-table", root)).toBeUndefined();
  });

  it("rejects files that are not recordings of that sample", async () => {
    const root = await tempRoot({ a: { sampleId: "b", model: "m", recordedAt: "2026-11-20T10:00:00.000Z", responses: ["{}"] } });
    expect(await loadRecording("a", root)).toBeUndefined();
  });

  it("replays responses through the same validation as live calls", async () => {
    // Test input: an invalid response with nothing after it. Not a real recording.
    const root = await tempRoot({ s: { sampleId: "s", model: "m", recordedAt: "2026-11-20T10:00:00.000Z", responses: ["{}"] } });
    const recording = await loadRecording("s", root);
    expect(recording).toBeDefined();
    const result = await extractFromRecording(recording!, document);
    // First answer fails validation, the retry has nothing left to replay.
    expect(result).toMatchObject({ ok: false, code: "model_error" });
  });
});

describe("bundled samples", () => {
  it("have a PDF and ground truth for every sample", async () => {
    const { access } = await import("node:fs/promises");
    for (const sample of SAMPLE_QUOTES) {
      await expect(access(path.join(process.cwd(), "public/samples", `${sample.id}.pdf`))).resolves.toBeUndefined();
      await expect(access(path.join(process.cwd(), "fixtures/truth", `${sample.id}.json`))).resolves.toBeUndefined();
    }
  });
});
