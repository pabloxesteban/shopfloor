import { Table, Td, Th } from "@/components/ui/table";
import { GLASS_LABELS, PRODUCT_TYPE_LABELS } from "@/domain/catalog";
import { formatMoney } from "@/domain/money";
import type { OrderItem } from "@/domain/order";
import { billableAreaCm2, lineTotalCents, orderTotalCents, unitPriceCents } from "@/domain/pricing";

function formatArea(cm2: number) {
  return `${(cm2 / 10_000).toFixed(2)} m²`;
}

export function ItemsTable({ items }: { items: OrderItem[] }) {
  return (
    <Table caption="Order items with computed prices">
      <thead>
        <tr>
          <Th scope="col" sticky>
            Product
          </Th>
          <Th scope="col">Size</Th>
          <Th scope="col">Glass</Th>
          <Th scope="col">Color</Th>
          <Th scope="col" className="text-right">
            Qty
          </Th>
          <Th scope="col" className="text-right">
            Unit price
          </Th>
          <Th scope="col" className="text-right">
            Line total
          </Th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={index}>
            <Td sticky className="min-w-40">
              <div className="font-medium">{PRODUCT_TYPE_LABELS[item.productType]}</div>
              <div className="text-xs text-muted">{item.series} series</div>
            </Td>
            <Td className="tabular whitespace-nowrap">
              {item.widthCm} x {item.heightCm} cm
              <div className="text-xs text-muted">billed {formatArea(billableAreaCm2(item.widthCm, item.heightCm))}</div>
            </Td>
            <Td className="whitespace-nowrap">{GLASS_LABELS[item.glass]}</Td>
            <Td className="whitespace-nowrap">{item.color}</Td>
            <Td className="tabular text-right">{item.quantity}</Td>
            <Td className="tabular text-right whitespace-nowrap">{formatMoney(unitPriceCents(item))}</Td>
            <Td className="tabular text-right font-medium whitespace-nowrap">{formatMoney(lineTotalCents(item))}</Td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <Th scope="row" colSpan={6} className="bg-surface text-right normal-case">
            Order total
          </Th>
          <Td className="tabular text-right text-base font-semibold whitespace-nowrap" data-testid="order-total">
            {formatMoney(orderTotalCents(items))}
          </Td>
        </tr>
      </tfoot>
    </Table>
  );
}
