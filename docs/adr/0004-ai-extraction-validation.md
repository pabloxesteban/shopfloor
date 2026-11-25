# 4. Validating AI extraction and keeping a person in the loop

Status: accepted

## Context

Supplier quotes arrive as PDFs and photos in many layouts. Reading them with a language model saves typing, but model output can be malformed, wrong, or confidently wrong. Bad data here changes stock levels the workshop relies on for ordering.

## Decision

1. **Server only.** Extraction runs in `src/server/ai/extract-quote.ts`, which imports `server-only`. The Gemini key is read from `GEMINI_API_KEY` on the server and never reaches the browser.
2. **Structured output, then zod.** The request asks for JSON with a response schema generated from the zod schema (`SupplierQuoteSchema`), with keywords the API does not support removed. The answer is then parsed and validated with zod. The model's output is untrusted until it passes.
3. **One retry.** If validation fails, the model is asked once more with the validation errors appended. A second failure returns a typed error (`invalid_output`) that the UI shows. SDK failures return `model_error` and are not retried.
4. **Confidence per field.** Every extracted field carries the model's own confidence from 0 to 1. This is a self-reported signal, not a calibrated probability. Fields under 0.8 are flagged on the review screen.
5. **Human review.** Nothing reaches stock until a person confirms the values. Each flagged field must be corrected or explicitly ticked as checked before the import button is enabled. The server keeps the list of flagged fields for each pending import, so a client cannot skip the review by sending an empty list.
6. **No silent drops.** Lines are matched to the catalog by SKU and unit. Lines without a SKU, with an unknown SKU, or with a different unit are listed as "not matched" with the reason.
7. **Prompt injection.** The prompt tells the model that the document is data. Even if a document contained instructions, the worst outcome is wrong field values, which the review step exists to catch.
8. **Demo mode.** Without a key, only bundled samples can be imported, and the result is replayed from `fixtures/recorded/<sample>.json`, which must hold real model responses saved by `pnpm ai:record`. The replay runs through the same validation and retry code. A sample without a recording shows "No recorded response for this sample yet". Responses are never written by hand.
9. **Evals.** `pnpm ai:eval` runs extraction over the 12 samples and scores each field against ground truth in `fixtures/truth/`. The scorer is unit tested with hand-built inputs.
10. **Rate limit.** Live extraction is limited to 5 requests per 10 minutes per IP, in memory. Best effort only: it resets on restart and is not shared between instances.

## Consequences

- A malformed answer costs at most one extra call and never reaches the database.
- Self-reported confidence can be wrong in both directions. The review screen still shows every field, so a person can correct unflagged values too.
- No recordings or eval numbers exist yet, because no API key was available while this was built. The response schema has not been checked against the live API. The README marks these as pending.
