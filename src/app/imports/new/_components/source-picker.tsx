"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { MAX_UPLOAD_BYTES, type ExtractState, type SampleOption } from "../import-state";

interface SourcePickerProps {
  live: boolean;
  samples: SampleOption[];
  action: (formData: FormData) => void;
  pending: boolean;
  state: ExtractState;
}

export function SourcePicker({ live, samples, action, pending, state }: SourcePickerProps) {
  const [fileError, setFileError] = useState<string>();
  const firstUsable = samples.find((s) => live || s.hasRecording) ?? samples[0];

  return (
    <div className="space-y-6">
      {state.status === "error" ? (
        <div role="alert" className="rounded-md border border-danger/40 bg-danger-soft px-4 py-3 text-sm">
          <p className="font-medium text-danger">{state.message}</p>
          {state.detail ? <p className="mt-1 text-text">{state.detail}</p> : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card aria-labelledby="samples-title" className="min-w-0 lg:col-span-2">
          <CardHeader
            id="samples-title"
            title="Bundled sample quotes"
            description="Twelve fictional supplier quotes with different layouts. Open a PDF to see what the model reads."
          />
          <form action={action} className="px-4 py-4 sm:px-5">
            <input type="hidden" name="source" value="sample" />
            <fieldset>
              <legend className="sr-only">Choose a sample</legend>
              <ul className="grid gap-2 sm:grid-cols-2">
                {samples.map((sample) => (
                  <li key={sample.id}>
                    <label className="flex h-full cursor-pointer gap-3 rounded-md border border-border p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                      <input
                        type="radio"
                        name="sampleId"
                        value={sample.id}
                        defaultChecked={sample.id === firstUsable?.id}
                        className="mt-0.5 size-4 accent-[var(--accent)]"
                      />
                      <span className="min-w-0">
                        <span className="block font-medium">{sample.label}</span>
                        <span className="block text-xs text-muted">{sample.note}</span>
                        {!live ? (
                          <span className="mt-1 block">
                            {sample.hasRecording ? <Badge tone="success">Recorded</Badge> : <Badge>No recording yet</Badge>}
                          </span>
                        ) : null}
                      </span>
                    </label>
                    <a
                      href={`/samples/${sample.id}.pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs text-accent hover:underline"
                    >
                      Open PDF
                      <span className="sr-only">: {sample.label} (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </fieldset>
            <Button type="submit" variant="signal" className="mt-4" disabled={pending}>
              {pending ? "Reading the quote..." : "Extract selected sample"}
            </Button>
          </form>
        </Card>

        <Card aria-labelledby="upload-title" className="min-w-0 self-start">
          <CardHeader id="upload-title" title="Upload a quote" description="PDF, JPG or PNG, up to 5 MB." />
          <form
            action={action}
            className="space-y-3 px-4 py-4 sm:px-5"
            onSubmit={(event) => {
              const file = new FormData(event.currentTarget).get("file");
              const problem =
                !(file instanceof File) || file.size === 0
                  ? "Choose a file first."
                  : file.size > MAX_UPLOAD_BYTES
                    ? "The file is larger than 5 MB."
                    : undefined;
              setFileError(problem);
              if (problem) event.preventDefault();
            }}
          >
            <input type="hidden" name="source" value="upload" />
            {!live ? (
              <p className="text-sm text-muted">
                Uploads need live extraction, which is off on this server (no API key). Use a bundled sample.
              </p>
            ) : null}
            <div>
              <label htmlFor="quote-file" className="text-sm font-medium">
                Quote file
              </label>
              <input
                id="quote-file"
                name="file"
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                disabled={!live}
                aria-invalid={fileError ? true : undefined}
                aria-describedby={fileError ? "quote-file-error" : undefined}
                className="mt-1 block w-full text-sm file:mr-3 file:rounded-md file:border file:border-border-strong file:bg-surface file:px-3 file:py-1.5 file:text-sm disabled:opacity-60"
              />
              {fileError ? (
                <p id="quote-file-error" className="mt-1 text-xs font-medium text-danger">
                  {fileError}
                </p>
              ) : null}
            </div>
            <Button type="submit" disabled={!live || pending}>
              {pending ? "Reading the quote..." : "Extract uploaded file"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
