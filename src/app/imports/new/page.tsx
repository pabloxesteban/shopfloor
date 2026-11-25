import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
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
    SAMPLE_QUOTES.map(async (s) => ({ ...s, hasRecording: (await loadRecording(s.id)) !== undefined })),
  );
  return (
    <>
      <div className="mb-4">
        {live ? (
          <Badge tone="accent">Live extraction with Gemini</Badge>
        ) : (
          <Badge>Demo mode · no API key on this server, recorded responses only</Badge>
        )}
      </div>
      <ImportFlow live={live} samples={samples} />
    </>
  );
}

export default function ImportPage() {
  return (
    <>
      <PageHeader
        title="Import supplier quote"
        description={`The server reads the quote with an AI model and returns each field with a confidence score. Fields under ${Math.round(CONFIDENCE_THRESHOLD * 100)}% are flagged and must be checked before anything reaches stock.`}
      />
      <Suspense fallback={<Skeleton className="h-96 rounded-lg" />}>
        <ImportWorkspace />
      </Suspense>
    </>
  );
}
