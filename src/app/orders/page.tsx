import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandBand } from "@/components/brand-band";
import { Card } from "@/components/ui/card";
import { parseOrdersQuery, type OrdersQuery } from "@/domain/orders-query";
import { FilterBar } from "./_components/filter-bar";
import { OrderStats } from "./_components/order-stats";
import { OrdersTable } from "./_components/orders-table";
import { FilterBarSkeleton, StatsSkeleton, TableSkeleton } from "./_components/skeletons";

export const metadata: Metadata = { title: "Orders" };

async function FilterBarFromUrl({ query }: { query: Promise<OrdersQuery> }) {
  return <FilterBar query={await query} />;
}

export default function OrdersPage({ searchParams }: PageProps<"/orders">) {
  // Parsed once here; the filter bar and the table both read this result.
  const query = searchParams.then(parseOrdersQuery);

  return (
    <>
      <BrandBand label="Orders overview">
        <h1 className="display text-2xl sm:text-3xl">Orders</h1>
        <p className="mt-1 mb-8 text-sm text-brand-muted">Quotes and orders for windows, doors and fixed panels.</p>
        <Suspense fallback={<StatsSkeleton />}>
          <OrderStats />
        </Suspense>
      </BrandBand>
      <div className="space-y-6">
        <Card aria-label="Orders list">
          <Suspense fallback={<FilterBarSkeleton />}>
            <FilterBarFromUrl query={query} />
          </Suspense>
          <Suspense fallback={<TableSkeleton />}>
            <OrdersTable query={query} />
          </Suspense>
        </Card>
      </div>
    </>
  );
}
