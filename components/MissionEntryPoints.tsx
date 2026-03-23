"use client";

import Link from "next/link";
import { UtensilsCrossed, Cookie, Sparkles, Salad, Wine, MapPin } from "lucide-react";
import { useMissionAware } from "./MissionAwareHome";
import { holmesMissionLockCombo } from "@aurora-studio/starter-core";
import { shouldLockRecipeMissionForMissionPill } from "@/lib/holmes-mission-lock";
import {
  CONTENT_BLOCK_CARD_FOOTER_BAND,
  CONTENT_BLOCK_CARD_SHELL,
} from "./ContentBlockProductCard";
import { LiveSignalsRow } from "./LiveSignalsRow";

const DEFAULT_MISSIONS = [
  { label: "Cook tonight", href: "/catalogue?q=dinner", icon: UtensilsCrossed },
  { label: "Quick top-up", href: "/catalogue?q=essentials", icon: Sparkles },
  { label: "Healthy week", href: "/catalogue?q=healthy", icon: Salad },
  { label: "Hosting / drinks", href: "/catalogue?q=wine+cheese", icon: Wine },
  { label: "Travel / last minute", href: "/catalogue?q=travel+essentials", icon: MapPin },
] as const;

const ICON_MAP: Record<string, typeof UtensilsCrossed> = {
  "Cook dinner": UtensilsCrossed,
  "Cook tonight": UtensilsCrossed,
  "Quick snacks": Cookie,
  "Top up essentials": Sparkles,
  "Quick top-up": Sparkles,
  "Healthy week": Salad,
  "Hosting / guests": Wine,
  "Hosting / drinks": Wine,
  "Travel essentials": MapPin,
  "Travel / last minute": MapPin,
  "Packing checklist": MapPin,
  "Recipe ideas": Sparkles,
  "Quick meals": UtensilsCrossed,
};

/** Mission-based entry points - Holmes-influenced when inference exists, else defaults. */
export function MissionEntryPoints() {
  const homeData = useMissionAware();
  const missions = homeData?.missions?.length
    ? homeData.missions.map((m) => ({
        label: m.label,
        href: m.href,
        icon: ICON_MAP[m.label] ?? Sparkles,
      }))
    : DEFAULT_MISSIONS;

  return (
    <section className="py-8">
      <div
        className={`rounded-xl bg-white overflow-hidden dark:bg-aurora-surface ${CONTENT_BLOCK_CARD_SHELL}`}
      >
        <div className="p-5 sm:p-6">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-aurora-text mb-1">
            Shop by mission
          </h2>
          <p className="text-sm text-aurora-muted mb-5 max-w-2xl">
            Pick a path — we&apos;ll adapt aisles and suggestions as we learn what you&apos;re trying to do. No
            single mode is forced.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {missions.map((m) => {
              const Icon = m.icon;
              const href = m.label === "Recipe ideas" ? "/for-you/recipes" : m.href;
              return (
                <Link
                  key={m.label}
                  href={href}
                  onClick={() => {
                    if (shouldLockRecipeMissionForMissionPill(m.label, href)) holmesMissionLockCombo();
                  }}
                  className="group flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-br from-[#fafdfb] to-[#f0f7f3] dark:from-aurora-bg dark:to-aurora-surface border border-stone-200/90 dark:border-aurora-border/80 shadow-sm hover:border-aurora-primary/45 hover:shadow-md transition-all font-semibold text-aurora-text text-sm sm:text-base"
                >
                  <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#14532d]/10 text-[#14532d] dark:bg-aurora-primary/15 dark:text-aurora-primary group-hover:bg-[#14532d]/15 transition-colors">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-left leading-snug">{m.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
        <div className={CONTENT_BLOCK_CARD_FOOTER_BAND}>
          <LiveSignalsRow embedded />
        </div>
      </div>
    </section>
  );
}
