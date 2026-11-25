/** Label next to the hero figure. At zero it is a full sentence and the figure is dropped. */
export function stockHeroLabel(count: number): string {
  if (count === 0) return "All materials above reorder point";
  return count === 1 ? "material below reorder point" : "materials below reorder point";
}

export function StockHero({ lowCount }: { lowCount: number }) {
  if (lowCount === 0) {
    return <p className="display text-4xl leading-tight sm:text-5xl">{stockHeroLabel(0)}</p>;
  }
  return (
    <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <span className="display tabular text-7xl leading-none sm:text-8xl">{lowCount}</span>
      <span className="text-lg">{stockHeroLabel(lowCount)}</span>
    </p>
  );
}
