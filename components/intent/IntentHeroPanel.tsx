"use client";

import type { HeroVariant } from "@/lib/hero-intent";

/**
 * Photography-led hero: intent + confidence drive image and copy (synced with CommandSurface card).
 */
export function IntentHeroPanel({
  hero,
  edgeToEdge = false,
}: {
  hero: HeroVariant;
  /** Full-width band under nav: no side radius, fill parent height. */
  edgeToEdge?: boolean;
}) {
  return (
    <div
      className={
        edgeToEdge
          ? "relative h-full min-h-[300px] w-full overflow-hidden bg-aurora-surface"
          : "relative w-full min-h-[280px] sm:min-h-[340px] lg:h-[420px] rounded-2xl overflow-hidden border border-aurora-border/80 shadow-md bg-aurora-surface"
      }
    >
      <img
        src={hero.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/55 to-transparent dark:from-[#0a0f0c]/92 dark:via-[#0a0f0c]/50 dark:to-transparent"
        aria-hidden
      />
      <div className="relative z-[1] flex h-full min-h-[inherit] flex-col justify-end p-6 sm:p-8 lg:justify-center lg:p-10">
        <div className="max-w-md">
          <h2 className="font-display text-2xl sm:text-3xl lg:text-[2rem] font-bold tracking-tight text-aurora-text text-balance">
            {hero.title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-aurora-muted font-medium leading-snug">
            {hero.subtitle}
          </p>
          {hero.caption ? (
            <p className="mt-1.5 text-xs text-aurora-muted/90">{hero.caption}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
