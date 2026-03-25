/** Shown immediately on client navigation until the cart RSC payload streams. */
export default function CartLoading() {
  return (
    <div className="min-h-[50vh]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
        <div className="h-24 rounded-xl bg-aurora-surface-hover animate-pulse mb-6" />
      </div>
      <div className="max-w-6xl mx-auto py-10 sm:py-12 px-4 sm:px-6">
        <div className="h-10 w-64 rounded-lg bg-aurora-surface-hover animate-pulse mb-6" />
        <div className="h-16 rounded-xl bg-aurora-surface-hover animate-pulse mb-8" />
        <div className="grid lg:grid-cols-[1fr_minmax(280px,360px)] gap-8 lg:gap-10 items-start">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-4 p-4 rounded-xl border border-aurora-border/50 bg-aurora-surface/50"
              >
                <div className="w-20 h-20 shrink-0 rounded-lg bg-aurora-surface-hover animate-pulse" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 max-w-[220px] w-[min(100%,14rem)] rounded bg-aurora-surface-hover animate-pulse" />
                  <div className="h-4 w-24 rounded bg-aurora-surface-hover animate-pulse" />
                  <div className="h-8 w-28 rounded-lg bg-aurora-surface-hover animate-pulse mt-2" />
                </div>
              </div>
            ))}
          </div>
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="h-48 rounded-2xl bg-aurora-surface-hover animate-pulse" />
            <div className="h-12 rounded-xl bg-aurora-surface-hover animate-pulse" />
          </div>
        </div>
      </div>
      <p className="sr-only">Loading basket</p>
    </div>
  );
}
