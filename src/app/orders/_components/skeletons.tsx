import { Skeleton } from "@/components/ui/skeleton";

export function StatsSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-end lg:gap-12" aria-hidden="true">
      <div className="space-y-6">
        <div className="h-28 w-48 rounded-lg bg-brand-2" />
        <div className="h-16 rounded-lg bg-brand-2" />
      </div>
      <div className="h-52 rounded-lg bg-brand-2" />
    </div>
  );
}

export function FilterBarSkeleton() {
  return (
    <div className="space-y-3 border-b border-border px-4 py-4 sm:px-5">
      <div className="flex flex-wrap gap-2">
        {["w-14", "w-24", "w-24", "w-20", "w-28"].map((w, i) => (
          <Skeleton key={i} className={`h-8 rounded-full ${w}`} />
        ))}
      </div>
      <Skeleton className="h-8 w-32" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-2 px-4 py-4 sm:px-5">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
