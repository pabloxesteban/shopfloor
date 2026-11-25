import { Table, Td, Th } from "@/components/ui/table";
import { available, CATEGORY_LABELS, isLow, UNIT_LABELS, type Material } from "@/domain/material";

/** Available stock against the reorder point. Colour is secondary: the text says it too. */
function LevelBar({ material }: { material: Material }) {
  const low = isLow(material);
  const share = material.reorderPoint > 0 ? Math.min(1, Math.max(0, available(material) / material.reorderPoint)) : 1;
  return (
    <span className="flex items-center gap-2 whitespace-nowrap">
      <span aria-hidden="true" className="h-1.5 w-20 overflow-hidden rounded-full bg-border-strong/50">
        <span
          data-testid="level-fill"
          data-low={low ? "true" : "false"}
          className={low ? "block h-full rounded-full bg-signal-ink" : "block h-full rounded-full bg-accent"}
          style={{ width: `${Math.round(share * 100)}%` }}
        />
      </span>
      <span className={low ? "text-sm font-medium text-signal-ink" : "text-sm text-muted"}>{low ? "Low stock" : "OK"}</span>
    </span>
  );
}

export function MaterialsTable({ materials }: { materials: Material[] }) {
  if (materials.length === 0) {
    return (
      <p role="status" className="px-4 py-12 text-center text-sm text-muted sm:px-5">
        No materials match these filters.
      </p>
    );
  }
  return (
    <Table caption={`Materials in stock, ${materials.length} rows`}>
      <thead>
        <tr>
          <Th scope="col" sticky>
            SKU
          </Th>
          <Th scope="col">Material</Th>
          <Th scope="col">Category</Th>
          <Th scope="col" className="text-right">
            On hand
          </Th>
          <Th scope="col" className="text-right">
            Reserved
          </Th>
          <Th scope="col" className="text-right">
            Available
          </Th>
          <Th scope="col" className="text-right">
            Incoming
          </Th>
          <Th scope="col" className="text-right">
            Reorder at
          </Th>
          <Th scope="col">Level</Th>
        </tr>
      </thead>
      <tbody>
        {materials.map((m) => (
          <tr key={m.sku}>
            <Td sticky className="font-mono text-xs whitespace-nowrap">
              {m.sku}
            </Td>
            <Td className="min-w-48">
              {m.name}
              <div className="text-xs text-muted">per {UNIT_LABELS[m.unit]}</div>
            </Td>
            <Td>{CATEGORY_LABELS[m.category]}</Td>
            <Td className="tabular text-right">{m.onHand}</Td>
            <Td className="tabular text-right">{m.reserved}</Td>
            <Td className="tabular text-right font-medium">{available(m)}</Td>
            <Td className="tabular text-right">{m.incoming > 0 ? m.incoming : <span className="text-muted">0</span>}</Td>
            <Td className="tabular text-right">{m.reorderPoint}</Td>
            <Td>
              <LevelBar material={m} />
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
