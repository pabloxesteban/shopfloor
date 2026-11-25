"use client";

import { useActionState, useState } from "react";
import { Card } from "@/components/ui/card";
import { confirmImportAction, extractQuoteAction } from "../actions";
import type { ConfirmState, ExtractState, SampleOption } from "../import-state";
import { ImportSummary } from "./import-summary";
import { ReviewForm } from "./review-form";
import { SourcePicker } from "./source-picker";

const IDLE_EXTRACT: ExtractState = { status: "idle" };
const IDLE_CONFIRM: ConfirmState = { status: "idle" };

function Flow({ live, samples, onRestart }: { live: boolean; samples: SampleOption[]; onRestart: () => void }) {
  const [extracted, extract, extracting] = useActionState(extractQuoteAction, IDLE_EXTRACT);
  const [confirmed, confirm, confirming] = useActionState(confirmImportAction, IDLE_CONFIRM);

  if (confirmed.status === "done") {
    return (
      <Card className="px-4 py-5 sm:px-5">
        <ImportSummary result={confirmed} onRestart={onRestart} />
      </Card>
    );
  }

  if (extracted.status === "review") {
    return (
      <ReviewForm
        importId={extracted.importId}
        quote={extracted.quote}
        flaggedPaths={extracted.flaggedPaths}
        source={extracted.source}
        model={extracted.model}
        recordedAt={extracted.recordedAt}
        documentLabel={extracted.documentLabel}
        action={confirm}
        pending={confirming}
        error={confirmed.status === "error" ? confirmed.message : undefined}
        onCancel={onRestart}
      />
    );
  }

  return <SourcePicker live={live} samples={samples} action={extract} pending={extracting} state={extracted} />;
}

/** Restarting remounts the flow, which clears both action states. */
export function ImportFlow(props: { live: boolean; samples: SampleOption[] }) {
  const [run, setRun] = useState(0);
  return <Flow key={run} {...props} onRestart={() => setRun((r) => r + 1)} />;
}
