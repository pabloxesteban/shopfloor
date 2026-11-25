import type { MaterialUnit } from "@/domain/material";
import type { SupplierQuote } from "@/domain/supplier-quote";

export type ExtractState =
  | { status: "idle" }
  | { status: "error"; code: string; message: string; detail?: string }
  | {
      status: "review";
      importId: string;
      quote: SupplierQuote;
      flaggedPaths: string[];
      source: "live" | "recorded";
      model: string;
      recordedAt?: string;
      documentLabel: string;
    };

export interface MatchedSummary {
  sku: string;
  name: string;
  quantity: number;
  unit: MaterialUnit;
  incomingNow: number;
}

export interface UnmatchedSummary {
  description: string;
  sku: string | null;
  quantity: number;
  reason: string;
}

export type ConfirmState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "done";
      supplier: string;
      quoteNumber: string | null;
      matched: MatchedSummary[];
      unmatched: UnmatchedSummary[];
    };

export interface SampleOption {
  id: string;
  label: string;
  note: string;
  hasRecording: boolean;
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
