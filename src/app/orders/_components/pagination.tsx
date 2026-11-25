import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { ordersHref, type OrdersQuery } from "@/domain/orders-query";

interface PaginationProps {
  query: OrdersQuery;
  page: number;
  pageCount: number;
  from: number;
  to: number;
  total: number;
}

export function Pagination({ query, page, pageCount, from, to, total }: PaginationProps) {
  const disabled = buttonClasses({ size: "sm" }) + " pointer-events-none opacity-50";
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
      <p role="status" className="tabular text-sm text-muted">
        Showing {from} to {to} of {total} orders
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={ordersHref(query, { page: page - 1 })} className={buttonClasses({ size: "sm" })} rel="prev">
            Previous
          </Link>
        ) : (
          <span aria-disabled="true" className={disabled}>
            Previous
          </span>
        )}
        <span className="tabular text-sm text-muted">
          Page {page} of {pageCount}
        </span>
        {page < pageCount ? (
          <Link href={ordersHref(query, { page: page + 1 })} className={buttonClasses({ size: "sm" })} rel="next">
            Next
          </Link>
        ) : (
          <span aria-disabled="true" className={disabled}>
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
