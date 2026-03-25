import { Sparkles } from "lucide-react";

/** Shown immediately on client navigation until the For You RSC payload streams. */
export default function ForYouLoading() {
  return (
    <div className="max-w-5xl mx-auto py-14 sm:py-16 px-4 sm:px-6">
      <div className="mb-10 sm:mb-12">
        <div className="h-3 w-16 rounded bg-aurora-surface-hover animate-pulse mb-3" />
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-aurora-primary/10 text-aurora-primary">
            <Sparkles className="w-5 h-5 opacity-40" aria-hidden />
          </div>
          <div className="h-9 w-40 sm:w-48 rounded-lg bg-aurora-surface-hover animate-pulse" />
        </div>
        <div className="h-4 max-w-xl rounded bg-aurora-surface-hover animate-pulse mt-3" />
        <div className="h-4 max-w-md rounded bg-aurora-surface-hover animate-pulse mt-2" />
      </div>
      <div className="space-y-8">
        <div className="h-20 rounded-2xl bg-aurora-surface-hover animate-pulse" />
        <div className="h-32 rounded-2xl bg-aurora-surface-hover animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-xl bg-aurora-surface-hover animate-pulse"
            />
          ))}
        </div>
      </div>
      <p className="sr-only">Loading For You</p>
    </div>
  );
}
