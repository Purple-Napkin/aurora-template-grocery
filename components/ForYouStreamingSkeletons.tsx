/** Fallback while header CMS rails stream in (inside Suspense on For You). */
export function ForYouHeaderRailsSkeleton() {
  return (
    <div className="mt-4 space-y-3" aria-hidden>
      <div className="h-4 w-40 rounded-md bg-aurora-surface-hover animate-pulse" />
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 min-w-[140px] flex-1 max-w-[200px] rounded-xl bg-aurora-surface-hover animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

/** Fallback while recipe rail + grouped sections stream in. */
export function ForYouSectionsSkeleton() {
  return (
    <div className="space-y-12 sm:space-y-14" aria-busy="true" aria-label="Loading suggestions">
      <section className="space-y-4">
        <div className="h-7 w-48 rounded-md bg-aurora-surface-hover animate-pulse" />
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-44 w-36 shrink-0 rounded-2xl bg-aurora-surface-hover animate-pulse"
            />
          ))}
        </div>
      </section>
      <div className="space-y-6">
        <div className="h-6 w-56 rounded-md bg-aurora-surface-hover animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-aurora-surface-hover animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
