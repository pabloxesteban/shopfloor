import type { Metadata } from "next";
import Form from "next/form";
import { Suspense } from "react";
import { BrandBand } from "@/components/brand-band";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_LABELS, MATERIAL_CATEGORIES } from "@/domain/material";
import { parseStockQuery, type StockQuery } from "@/domain/stock-query";
import { getMaterials } from "@/server/queries";
import { LowStockChart } from "./_components/low-stock-chart";
import { MaterialsTable } from "./_components/materials-table";
import { StockHero } from "./_components/stock-hero";

export const metadata: Metadata = { title: "Stock" };

function StockFilters({ query }: { query: StockQuery }) {
  return (
    // A plain GET form: works without JavaScript and keeps filters in the URL.
    <Form
      action="/stock"
      key={`${query.category ?? "all"}-${query.lowOnly}`}
      className="flex flex-wrap items-end gap-3 border-b border-border px-4 py-4 sm:px-5"
    >
      <div className="w-44">
        <label htmlFor="stock-category" className="text-xs font-medium text-muted">
          Category
        </label>
        <Select id="stock-category" name="category" defaultValue={query.category ?? ""} className="mt-1">
          <option value="">All categories</option>
          {MATERIAL_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </Select>
      </div>
      <label className="flex h-10 items-center gap-2 text-sm">
        <input type="checkbox" name="low" value="1" defaultChecked={query.lowOnly} className="size-4 accent-[var(--accent)]" />
        Low stock only
      </label>
      <Button type="submit" size="md">
        Apply
      </Button>
    </Form>
  );
}

async function StockHeroFigure() {
  const lowItems = await getMaterials({ lowOnly: true });
  return <StockHero lowCount={lowItems.length} />;
}

async function StockContent({ searchParams }: { searchParams: PageProps<"/stock">["searchParams"] }) {
  const query = parseStockQuery(await searchParams);
  const [materials, lowItems] = await Promise.all([getMaterials(query), getMaterials({ lowOnly: true })]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card aria-label="Materials" className="min-w-0 xl:col-span-2">
        <StockFilters query={query} />
        <MaterialsTable materials={materials} />
      </Card>
      <Card aria-labelledby="low-title" className="min-w-0 self-start">
        <CardHeader
          id="low-title"
          title={`Low stock (${lowItems.length})`}
          description="Available plus incoming is under the reorder point."
        />
        <div className="px-4 py-4 sm:px-5">
          <LowStockChart materials={lowItems} />
        </div>
      </Card>
    </div>
  );
}

export default function StockPage({ searchParams }: PageProps<"/stock">) {
  return (
    <>
      <BrandBand label="Stock overview">
        <h1 className="display text-2xl sm:text-3xl">Stock</h1>
        <p className="mt-1 mb-8 text-sm text-brand-muted">
          Aluminum profiles, glass and hardware. Available means on hand minus reserved.
        </p>
        <Suspense fallback={<Skeleton className="h-20 rounded-lg" />}>
          <StockHeroFigure />
        </Suspense>
      </BrandBand>
      <Suspense fallback={<Skeleton className="h-96 rounded-lg" />}>
        <StockContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
