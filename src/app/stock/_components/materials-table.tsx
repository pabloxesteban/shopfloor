import { Badge } from "@/components/ui/badge";
import { Table, Td, Th } from "@/components/ui/table";
import { available, CATEGORY_LABELS, isLow, UNIT_LABELS, type Material } from "@/domain/material";

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
            <Td>{isLow(m) ? <Badge tone="danger">Low stock</Badge> : <Badge>OK</Badge>}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
