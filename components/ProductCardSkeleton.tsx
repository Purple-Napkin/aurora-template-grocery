export function ProductCardSkeleton() {
  return (
    <div className="p-4 rounded-component bg-aurora-surface/80 border border-aurora-border overflow-hidden">
      <div className="aspect-square rounded-component bg-aurora-surface-hover mb-3 overflow-hidden animate-pulse" />
      <div className="h-4 rounded bg-aurora-surface-hover animate-pulse w-3/4 mb-2" />
      <div className="h-3 rounded bg-aurora-surface-hover animate-pulse w-1/3" />
    </div>
  );
}
