import { Skeleton } from "@/components/ui/skeleton";
import { FilterBarSkeleton, StatsSkeleton, TableSkeleton } from "./_components/skeletons";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading orders">
      <Skeleton className="mb-6 h-8 w-40" />
      <div className="space-y-6">
        <StatsSkeleton />
        <div className="rounded-lg border border-border bg-surface">
          <FilterBarSkeleton />
          <TableSkeleton />
        </div>
      </div>
    </div>
  );
}
