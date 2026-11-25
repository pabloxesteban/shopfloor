import { Skeleton } from "@/components/ui/skeleton";

export function StatsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}

export function FilterBarSkeleton() {
  return (
    <div className="space-y-3 border-b border-border px-4 py-4 sm:px-5">
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-14 w-64" />
        <Skeleton className="h-14 w-36" />
        <Skeleton className="h-14 w-40" />
        <Skeleton className="h-14 w-40" />
      </div>
      <Skeleton className="h-7 w-full max-w-xl" />
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
