import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/button";
import { Table, Td, Th } from "@/components/ui/table";
import { UNIT_LABELS } from "@/domain/material";
import type { ConfirmState } from "../import-state";

export function ImportSummary({ result, onRestart }: { result: Extract<ConfirmState, { status: "done" }>; onRestart: () => void }) {
  return (
    <div className="space-y-6">
      <div role="status" className="rounded-md border border-success/40 bg-success-soft px-4 py-3 text-sm text-success">
        Imported {result.supplier}
        {result.quoteNumber ? ` quote ${result.quoteNumber}` : ""}. {result.matched.length} line
        {result.matched.length === 1 ? "" : "s"} added to incoming stock
        {result.unmatched.length > 0 ? `, ${result.unmatched.length} not matched` : ""}.
      </div>

      <section aria-labelledby="matched-title">
        <h2 id="matched-title" className="mb-2 text-sm font-semibold">
          Added to incoming stock
        </h2>
        {result.matched.length === 0 ? (
          <p className="text-sm text-muted">No line matched a SKU in the catalog.</p>
        ) : (
          <Table caption="Lines added to incoming stock">
            <thead>
              <tr>
                <Th scope="col" sticky>
                  SKU
                </Th>
                <Th scope="col">Material</Th>
                <Th scope="col" className="text-right">
                  Added
                </Th>
                <Th scope="col" className="text-right">
                  Incoming now
                </Th>
              </tr>
            </thead>
            <tbody>
              {result.matched.map((m, i) => (
                <tr key={`${m.sku}-${i}`}>
                  <Td sticky className="font-mono text-xs">
                    {m.sku}
                  </Td>
                  <Td>{m.name}</Td>
                  <Td className="tabular text-right">
                    {m.quantity} {UNIT_LABELS[m.unit]}
                  </Td>
                  <Td className="tabular text-right">{m.incomingNow}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>

      <section aria-labelledby="unmatched-title">
        <h2 id="unmatched-title" className="mb-2 text-sm font-semibold">
          Not matched ({result.unmatched.length})
        </h2>
        {result.unmatched.length === 0 ? (
          <p className="text-sm text-muted">Every line matched a catalog SKU.</p>
        ) : (
          <>
            <p className="mb-2 text-sm text-muted">These lines were not added to stock. Handle them by hand if needed.</p>
            <ul className="divide-y divide-border rounded-md border border-border">
              {result.unmatched.map((u, i) => (
                <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-sm">
                  <span>
                    {u.description}
                    {u.sku ? <span className="ml-2 font-mono text-xs text-muted">{u.sku}</span> : null}
                  </span>
                  <span className="text-xs font-medium text-warning">{u.reason}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/stock" className={buttonClasses({ variant: "primary" })}>
          View stock
        </Link>
        <Button onClick={onRestart}>Import another quote</Button>
      </div>
    </div>
  );
}
