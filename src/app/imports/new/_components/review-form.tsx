"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Field, Input, Select } from "@/components/ui/field";
import { formatDate } from "@/domain/dates";
import { MATERIAL_UNITS, UNIT_LABELS } from "@/domain/material";
import { CURRENCIES, formatMoney, toCents } from "@/domain/money";
import { linesTotal, PlainQuoteSchema, type SupplierQuote } from "@/domain/supplier-quote";

type HeaderField = "supplier" | "quoteNumber" | "date" | "currency" | "total";
type LineField = "description" | "sku" | "quantity" | "unit" | "unitPrice";

interface Draft {
  header: Record<HeaderField, string>;
  lines: Record<LineField, string>[];
}

const asText = (value: string | number | null) => (value === null ? "" : String(value));

function toDraft(quote: SupplierQuote): Draft {
  return {
    header: {
      supplier: quote.supplier.value,
      quoteNumber: asText(quote.quoteNumber.value),
      date: asText(quote.date.value),
      currency: quote.currency.value,
      total: String(quote.total.value),
    },
    lines: quote.lines.map((line) => ({
      description: line.description.value,
      sku: asText(line.sku.value),
      quantity: String(line.quantity.value),
      unit: line.unit.value,
      unitPrice: String(line.unitPrice.value),
    })),
  };
}

const toNumber = (text: string) => (text.trim() === "" ? Number.NaN : Number(text.replace(",", ".")));
const orNull = (text: string) => (text.trim() === "" ? null : text.trim());

function fromDraft(draft: Draft): unknown {
  return {
    supplier: draft.header.supplier.trim(),
    quoteNumber: orNull(draft.header.quoteNumber),
    date: orNull(draft.header.date),
    currency: draft.header.currency,
    total: toNumber(draft.header.total),
    lines: draft.lines.map((line) => ({
      description: line.description.trim(),
      sku: orNull(line.sku),
      quantity: toNumber(line.quantity),
      unit: line.unit,
      unitPrice: toNumber(line.unitPrice),
    })),
  };
}

type Level = "high" | "check" | "low";

const LEVELS: Record<Level, { word: string; filled: number; bar: string; text: string }> = {
  high: { word: "High", filled: 3, bar: "bg-success", text: "text-success" },
  check: { word: "Check", filled: 2, bar: "bg-muted", text: "text-muted" },
  low: {
    word: "Low",
    filled: 1,
    bar: "bg-signal-ink",
    text: "text-signal-ink",
  },
};

const levelOf = (confidence: number): Level => (confidence >= 0.9 ? "high" : confidence >= 0.7 ? "check" : "low");

/** Three-segment meter. The word carries the meaning; the bar is decoration. */
function ConfidenceMeter({ confidence }: { confidence: number }) {
  const level = LEVELS[levelOf(confidence)];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span aria-hidden className="flex gap-0.5">
        {[1, 2, 3].map((n) => (
          <span key={n} className={cn("h-1.5 w-3 rounded-full", n <= level.filled ? level.bar : "bg-border-strong")} />
        ))}
      </span>
      <span className={level.text}>{level.word}</span>
    </span>
  );
}

const LG_QUERY = "(min-width: 1024px)";

/** Open and fixed on wide screens, a collapsed disclosure below lg. */
function DocumentPanel({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(LG_QUERY);
    const sync = () => {
      setWide(query.matches);
      if (query.matches) setOpen(true);
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className="rounded-lg border border-border bg-surface lg:sticky lg:top-4 lg:self-start"
    >
      <summary
        className="cursor-pointer px-4 py-3 text-sm font-semibold marker:content-none lg:pointer-events-none lg:cursor-default"
        tabIndex={wide ? -1 : undefined}
      >
        Supplier document
      </summary>
      <div className="space-y-3 border-t border-border px-4 py-4 text-sm">{children}</div>
    </details>
  );
}

export interface ReviewFormProps {
  importId: string;
  quote: SupplierQuote;
  flaggedPaths: string[];
  source: "live" | "recorded";
  model: string;
  recordedAt?: string;
  documentLabel: string;
  action: (formData: FormData) => void;
  pending: boolean;
  error?: string;
  onCancel: () => void;
}

/**
 * Shows what was extracted and makes the user look at every field the model
 * was unsure about. Changing a flagged value counts as checking it; leaving it
 * as is requires ticking "Looks right". Import stays disabled until all
 * flagged fields are checked, and the server enforces the same rule.
 */
export function ReviewForm({
  importId,
  quote,
  flaggedPaths,
  source,
  model,
  recordedAt,
  documentLabel,
  action,
  pending,
  error,
  onCancel,
}: ReviewFormProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(quote));
  const [confirmed, setConfirmed] = useState<Set<string>>(() => new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const flagged = new Set(flaggedPaths);
  const remaining = flaggedPaths.filter((p) => !confirmed.has(p)).length;

  const confidence = (path: string): number => {
    const [first, index, field] = path.split(".");
    if (first === "lines" && index !== undefined && field) {
      return quote.lines[Number(index)]?.[field as LineField].confidence ?? 1;
    }
    return quote[first as HeaderField].confidence;
  };

  function confirm(path: string, value: boolean) {
    setConfirmed((current) => {
      const next = new Set(current);
      if (value) next.add(path);
      else next.delete(path);
      return next;
    });
  }

  function setHeader(field: HeaderField, value: string) {
    setDraft((d) => ({ ...d, header: { ...d.header, [field]: value } }));
    if (flagged.has(field)) confirm(field, true);
  }

  function setLine(index: number, field: LineField, value: string) {
    setDraft((d) => ({
      ...d,
      lines: d.lines.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    }));
    const path = `lines.${index}.${field}`;
    if (flagged.has(path)) confirm(path, true);
  }

  const parsed = PlainQuoteSchema.safeParse(fromDraft(draft));
  const payload = parsed.success
    ? JSON.stringify({
        importId,
        quote: parsed.data,
        confirmedPaths: [...confirmed],
      })
    : "";
  const sum = parsed.success ? linesTotal(parsed.data.lines) : undefined;
  const totalMismatch = parsed.success && sum !== undefined && toCents(sum) !== toCents(parsed.data.total);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (parsed.success && remaining === 0) {
      setErrors({});
      return;
    }
    event.preventDefault();
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path.join(".")] ??= issue.message;
      setErrors(next);
    }
  }

  function renderField(path: string, label: string, control: (props: { id: string; error?: string }) => ReactNode, className?: string) {
    const id = `review-${path.replaceAll(".", "-")}`;
    const isFlagged = flagged.has(path);
    const isChecked = confirmed.has(path);
    return (
      <div
        className={cn("rounded-md", isFlagged && !isChecked && "bg-warning-soft p-2 ring-1 ring-warning/50", className)}
        data-flagged={isFlagged || undefined}
        data-field={path}
      >
        <Field
          id={id}
          label={
            <span className="inline-flex flex-wrap items-center gap-2">
              {label}
              <ConfidenceMeter confidence={confidence(path)} />
              {isFlagged ? (
                <Badge tone={isChecked ? "success" : "warning"}>
                  {isChecked ? "Checked" : `Check this · ${Math.round(confidence(path) * 100)}% confidence`}
                </Badge>
              ) : null}
            </span>
          }
          error={errors[path]}
        >
          {control({ id, error: errors[path] })}
        </Field>
        {isFlagged ? (
          <label className="mt-1.5 flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              className="size-4 accent-[var(--accent)]"
              checked={isChecked}
              onChange={(e) => confirm(path, e.target.checked)}
            />
            Looks right
            <span className="sr-only">: {label}</span>
          </label>
        ) : null}
      </div>
    );
  }

  const currency = draft.header.currency === "USD" ? "USD" : "ARS";

  return (
    <form action={action} onSubmit={onSubmit} noValidate className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-6">
      <input type="hidden" name="review" value={payload} />

      <DocumentPanel>
        <div>
          <p className="text-xs text-muted">Extracted from</p>
          <p className="font-medium">{documentLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {source === "recorded" ? (
            <Badge tone="accent">Demo mode · recorded response</Badge>
          ) : (
            <Badge tone="accent">Live extraction</Badge>
          )}
          <span className="text-xs text-muted">
            {model}
            {recordedAt ? `, recorded ${formatDate(recordedAt)}` : ""}
          </span>
        </div>
        <p className="text-muted">
          {draft.lines.length} line{draft.lines.length === 1 ? "" : "s"} read. Compare each value with the document, then fix it or confirm
          it.
        </p>
      </DocumentPanel>

      <div className="min-w-0 space-y-6 rounded-lg border border-border bg-surface px-4 py-5 sm:px-5">
        <p role="status" aria-live="polite" className={cn("text-sm", remaining > 0 ? "text-warning" : "text-success")}>
          {flaggedPaths.length === 0
            ? "The model was confident about every field. Review the values and import."
            : remaining > 0
              ? `${remaining} of ${flaggedPaths.length} flagged field${flaggedPaths.length === 1 ? "" : "s"} still need checking.`
              : "All flagged fields are checked."}
        </p>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-sm font-semibold">Quote</legend>
          {renderField(
            "supplier",
            "Supplier",
            (p) => (
              <Input {...p} value={draft.header.supplier} onChange={(e) => setHeader("supplier", e.target.value)} />
            ),
            "sm:col-span-2",
          )}
          {renderField("quoteNumber", "Quote number", (p) => (
            <Input {...p} value={draft.header.quoteNumber} placeholder="None" onChange={(e) => setHeader("quoteNumber", e.target.value)} />
          ))}
          {renderField("date", "Date", (p) => (
            <Input {...p} type="date" value={draft.header.date} onChange={(e) => setHeader("date", e.target.value)} />
          ))}
          {renderField("currency", "Currency", (p) => (
            <Select {...p} value={draft.header.currency} onChange={(e) => setHeader("currency", e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          ))}
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold">Lines</legend>
          <ol className="space-y-3">
            {draft.lines.map((line, i) => (
              <li key={i} className="rounded-md border border-border p-3">
                <h3 className="mb-2 text-sm font-semibold">Line {i + 1}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {renderField(
                    `lines.${i}.description`,
                    "Description",
                    (p) => (
                      <Input {...p} value={line.description} onChange={(e) => setLine(i, "description", e.target.value)} />
                    ),
                    "sm:col-span-2",
                  )}
                  {renderField(`lines.${i}.sku`, "SKU", (p) => (
                    <Input {...p} value={line.sku} placeholder="None" onChange={(e) => setLine(i, "sku", e.target.value)} />
                  ))}
                  {renderField(`lines.${i}.quantity`, "Quantity", (p) => (
                    <Input {...p} inputMode="decimal" value={line.quantity} onChange={(e) => setLine(i, "quantity", e.target.value)} />
                  ))}
                  {renderField(`lines.${i}.unit`, "Unit", (p) => (
                    <Select {...p} value={line.unit} onChange={(e) => setLine(i, "unit", e.target.value)}>
                      {MATERIAL_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {UNIT_LABELS[u]}
                        </option>
                      ))}
                    </Select>
                  ))}
                  {renderField(`lines.${i}.unitPrice`, `Unit price (${currency})`, (p) => (
                    <Input {...p} inputMode="decimal" value={line.unitPrice} onChange={(e) => setLine(i, "unitPrice", e.target.value)} />
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          {renderField("total", `Total on document (${currency})`, (p) => (
            <Input {...p} inputMode="decimal" value={draft.header.total} onChange={(e) => setHeader("total", e.target.value)} />
          ))}
          <div className="self-end text-sm text-muted">
            Sum of lines:{" "}
            <span className="tabular font-medium text-text">{sum !== undefined ? formatMoney(toCents(sum), currency) : "n/a"}</span>
            {totalMismatch ? (
              <p className="mt-1 font-medium text-warning">The lines do not add up to the printed total. Check prices and quantities.</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <Button variant="ghost" onClick={onCancel}>
            Start over
          </Button>
          <div className="flex items-center gap-3">
            {error ? (
              <p role="alert" className="text-sm font-medium text-danger">
                {error}
              </p>
            ) : null}
            <Button type="submit" variant="signal" disabled={pending || remaining > 0}>
              {pending ? "Importing..." : "Import to stock"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
