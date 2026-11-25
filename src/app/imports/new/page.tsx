import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { BrandBand } from "@/components/brand-band";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CONFIDENCE_THRESHOLD } from "@/domain/supplier-quote";
import { isLiveExtractionConfigured } from "@/server/ai/extract-quote";
import { loadRecording } from "@/server/ai/recordings";
import { SAMPLE_QUOTES } from "@/server/ai/samples";
import { ImportFlow } from "./_components/import-flow";

export const metadata: Metadata = { title: "Import supplier quote" };

async function ImportWorkspace() {
  // The API key is read per request, not baked in at build time.
  await connection();
  const live = isLiveExtractionConfigured();
  const samples = await Promise.all(
    SAMPLE_QUOTES.map(async (s) => ({
      ...s,
      hasRecording: (await loadRecording(s.id)) !== undefined,
    })),
  );
  return (
    <>
      <p className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        {live ? (
          <>
            <Badge tone="accent">Live extraction</Badge>
            Quotes are read with Gemini on the server.
          </>
        ) : (
          <>
            <Badge>Demo mode</Badge>
            No API key on this server, so only recorded responses can be used.
          </>
        )}
      </p>
      <ImportFlow live={live} samples={samples} />
    </>
  );
}

export default function ImportPage() {
  return (
    <>
      <BrandBand label="Import supplier quote">
        <h1 className="display text-2xl sm:text-3xl">Import supplier quote</h1>
        <p className="mt-1 max-w-2xl text-sm text-brand-muted">
          {`The server reads the quote with an AI model and returns each field with a confidence score. Fields under ${Math.round(CONFIDENCE_THRESHOLD * 100)}% are flagged and must be checked before anything reaches stock.`}
        </p>
      </BrandBand>
      <Suspense fallback={<Skeleton className="h-96 rounded-lg" />}>
        <ImportWorkspace />
      </Suspense>
    </>
  );
}
