import Link from "next/link";
import { PriorityBadge, StatusBadge, Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Table, Td, Th } from "@/components/ui/table";
import { BUSINESS_TODAY, formatDate } from "@/domain/dates";
import { formatMoney } from "@/domain/money";
import { hasActiveFilters, ordersHref, type OrdersQuery, type SortField } from "@/domain/orders-query";
import { isOpen } from "@/domain/status";
import { getOrdersPage } from "@/server/queries";
import { Pagination } from "./pagination";

function SortHeader({ query, field, children, align }: { query: OrdersQuery; field: SortField; children: string; align?: "right" }) {
  const active = query.sort === field;
  // First click sorts the way people usually want: newest, soonest, biggest.
  const firstDir = field === "dueDate" ? "asc" : "desc";
  const dir = active ? (query.dir === "asc" ? "desc" : "asc") : firstDir;
  return (
    <Th
      scope="col"
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
      <Table caption={`Orders, ${from} to ${to} of ${result.total}`}>
        <thead>
          <tr>
            <Th scope="col" sticky>
              Order
            </Th>
            <Th scope="col">Customer</Th>
            <Th scope="col">Status</Th>
            <Th scope="col">Priority</Th>
            <SortHeader query={query} field="createdAt">
              Created
            </SortHeader>
            <SortHeader query={query} field="dueDate">
              Due
            </SortHeader>
            <Th scope="col" className="text-right">
              Units
            </Th>
            <SortHeader query={query} field="total" align="right">
              Total
            </SortHeader>
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row) => {
            const overdue = isOpen(row.status) && row.dueDate < BUSINESS_TODAY;
            return (
              <tr key={row.id} className="hover:bg-surface-muted/60">
                <Td sticky>
                  <Link href={`/orders/${row.id}`} className="font-mono text-sm font-medium text-accent hover:underline">
                    {row.id}
                  </Link>
                </Td>
                <Td className="min-w-44">
                  <div className="font-medium text-text">{row.customerName}</div>
                  <div className="text-xs text-muted">{row.town}</div>
                </Td>
                <Td>
                  <StatusBadge status={row.status} />
                </Td>
                <Td>
                  <PriorityBadge priority={row.priority} />
                </Td>
                <Td className="tabular whitespace-nowrap text-muted">{formatDate(row.createdAt)}</Td>
                <Td className="tabular whitespace-nowrap">
                  {formatDate(row.dueDate)}
                  {overdue ? (
                    <Badge tone="danger" className="ml-2">
                      Overdue
                    </Badge>
                  ) : null}
                </Td>
                <Td className="tabular text-right">{row.itemCount}</Td>
                <Td className="tabular text-right font-medium whitespace-nowrap">{formatMoney(row.totalCents)}</Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <Pagination query={query} page={result.page} pageCount={result.pageCount} from={from} to={to} total={result.total} />
    </>
  );
}
