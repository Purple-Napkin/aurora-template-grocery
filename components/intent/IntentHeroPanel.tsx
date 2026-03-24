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
          : "relative w-full min-h-[280px] sm:min-h-[340px] lg:h-[420px] rounded-[1.35rem] overflow-hidden border border-aurora-border/35 shadow-[0_8px_32px_rgba(27,67,50,0.08),0_2px_8px_rgba(27,67,50,0.04)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.4)] bg-aurora-surface"
      }
    >
      <img
        src={hero.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center scale-[1.02]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-[color-mix(in_srgb,white_88%,transparent)] via-[color-mix(in_srgb,white_48%,transparent)] to-transparent dark:from-[#0b100d]/94 dark:via-[#0b100d]/55 dark:to-transparent"
        aria-hidden
      />
      <div className="relative z-[1] flex h-full min-h-[inherit] flex-col justify-end p-7 sm:p-9 lg:justify-center lg:p-11">
        <div className="max-w-md">
          <h2 className="font-display text-2xl sm:text-3xl lg:text-[2rem] font-semibold tracking-[-0.02em] text-aurora-text text-balance">
            {hero.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-aurora-muted font-normal leading-relaxed">
            {hero.subtitle}
          </p>
          {hero.caption ? (
            <p className="mt-2 text-xs text-aurora-muted/85 leading-relaxed">{hero.caption}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
