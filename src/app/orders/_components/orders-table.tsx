import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Money } from "@/components/ui/money";
import { StageBar } from "@/components/ui/stage-bar";
import { Table, Td, Th } from "@/components/ui/table";
import { BUSINESS_TODAY, formatDate } from "@/domain/dates";
import { hasActiveFilters, ordersHref, type OrdersQuery, type SortField } from "@/domain/orders-query";
import { isOpen } from "@/domain/status";
import { formatMoney } from "@/domain/money";
import { getOrdersPage } from "@/server/queries";
import { dueLabel } from "./due-label";
import { Pagination } from "./pagination";

function SortHeader({ query, field, children, align }: { query: OrdersQuery; field: SortField; children: string; align?: "right" }) {
  const active = query.sort === field;
  // First click sorts the way people usually want: newest, soonest, biggest.
  const firstDir = field === "dueDate" ? "asc" : "desc";
  const dir = active ? (query.dir === "asc" ? "desc" : "asc") : firstDir;
  return (
    <Th
      scope="col"
      role="columnheader"
      aria-sort={active ? (query.dir === "asc" ? "ascending" : "descending") : undefined}
      className={align === "right" ? "text-right" : undefined}
    >
      <Link href={ordersHref(query, { sort: field, dir })} scroll={false} className="inline-flex items-center gap-1 hover:text-text">
        {children}
        <span aria-hidden="true">{active ? (query.dir === "asc" ? "↑" : "↓") : ""}</span>
      </Link>
    </Th>
  );
}

export async function OrdersTable({ query: queryPromise }: { query: Promise<OrdersQuery> }) {
  const query = await queryPromise;
  const result = await getOrdersPage(query);
  const from = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const to = Math.min(result.page * result.pageSize, result.total);

  if (result.total === 0) {
    return (
      <div className="px-4 py-12 text-center sm:px-5">
        <p role="status" className="font-medium text-text">
          No orders match these filters
        </p>
        <p className="mt-1 text-sm text-muted">Try a different search or remove some filters.</p>
        {hasActiveFilters(query) ? (
          <Link href="/orders" className={buttonClasses({ size: "sm" }) + " mt-4"}>
            Clear filters
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <Table caption={`Orders, ${from} to ${to} of ${result.total}`} cards>
        <thead role="rowgroup" className="max-sm:sr-only max-sm:focus-within:not-sr-only">
          <tr role="row">
            <Th scope="col" role="columnheader">
              Order
            </Th>
            <Th scope="col" role="columnheader">
              Stage
            </Th>
            <SortHeader query={query} field="dueDate">
              Due
            </SortHeader>
            <SortHeader query={query} field="total" align="right">
              Total
            </SortHeader>
          </tr>
        </thead>
        <tbody role="rowgroup" className="max-sm:space-y-3 max-sm:p-4">
          {result.rows.map((row) => {
            const late = isOpen(row.status) && row.dueDate < BUSINESS_TODAY;
            const urgent = row.priority === "urgent";
            const flagged = late || urgent;
            return (
              <tr
                key={row.id}
                role="row"
                className={cn(
                  "hover:bg-surface-muted/60",
                  "max-sm:block max-sm:rounded-xl max-sm:border max-sm:border-border max-sm:bg-surface max-sm:p-4 max-sm:hover:bg-surface",
                )}
              >
                <Td role="cell" className="min-w-0 max-sm:block max-sm:border-0 max-sm:p-0 sm:min-w-44">
                  <div className="font-semibold break-words text-text">{row.customerName}</div>
                  <Link href={`/orders/${row.id}`} className="font-mono text-xs text-accent hover:underline">
                    {row.id}
                  </Link>
                  <span className="text-xs text-muted"> · {row.town}</span>
                </Td>
                <Td role="cell" className="max-sm:mt-3 max-sm:block max-sm:border-0 max-sm:p-0">
                  <StageBar status={row.status} size="sm" />
                </Td>
                <Td role="cell" className="whitespace-nowrap max-sm:mt-1.5 max-sm:whitespace-normal max-sm:block max-sm:border-0 max-sm:p-0">
                  <span className="tabular">{formatDate(row.dueDate)}</span>
                  <span className={cn("ml-2 text-xs", flagged ? "font-medium text-signal-ink" : "text-muted")}>
                    {dueLabel(row, BUSINESS_TODAY)}
                  </span>
                </Td>
                <Td role="cell" className="text-right max-sm:mt-3 max-sm:block max-sm:border-0 max-sm:border-t max-sm:border-border max-sm:p-0 max-sm:pt-3 max-sm:text-left">
                  <Money value={formatMoney(row.totalCents)} className="display tabular text-[22px] leading-none" />
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <Pagination query={query} page={result.page} pageCount={result.pageCount} from={from} to={to} total={result.total} />
    </>
  );
}
