/** Matches product card structure exactly for loading state - preserves layout width */
export function ProductCardSkeleton() {
  return (
    <div className="group p-4 rounded-xl bg-aurora-surface border border-aurora-border overflow-hidden w-full min-w-[160px] min-h-[280px] flex flex-col">
      <div className="block">
        <div className="aspect-square rounded-lg bg-aurora-surface-hover mb-3 overflow-hidden skeleton-shimmer" />
        <div className="h-4 rounded skeleton-shimmer w-3/4 mb-1" />
        <div className="h-4 rounded skeleton-shimmer w-1/4" />
      </div>
      <div className="mt-auto pt-3">
        <div className="h-12 rounded-xl skeleton-shimmer w-full" />
      </div>
    </div>
  );
}
