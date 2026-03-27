"use client";

import Link from "next/link";
import { UtensilsCrossed, Cookie, Sparkles, Salad, Wine, MapPin, Apple } from "lucide-react";
import { useMissionAware } from "./MissionAwareHome";
import { holmesMissionLockCombo } from "@aurora-studio/starter-core";
import { shouldLockRecipeMissionForMissionPill } from "@/lib/holmes-mission-lock";
import {
  CONTENT_BLOCK_CARD_FOOTER_BAND,
  CONTENT_BLOCK_PANEL_SHELL,
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
  "Bakery & spreads": Apple,
  "Coffee & juice": Cookie,
  "Sandwiches & salads": Salad,
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
    <section className="py-10 sm:py-12">
      <div
        className={`rounded-[1.35rem] bg-white/85 backdrop-blur-md overflow-hidden dark:bg-aurora-surface/85 ${CONTENT_BLOCK_PANEL_SHELL}`}
      >
        <div className="p-6 sm:p-8">
          <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-aurora-text mb-2">
            Shop by mission
          </h2>
          <p className="text-sm text-aurora-muted mb-7 max-w-2xl leading-relaxed">
            Pick a path. We&apos;ll adapt aisles and suggestions as we learn what you&apos;re trying to do. No
            single mode is forced.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  className="group flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-gradient-to-br from-white/90 to-[color-mix(in_srgb,var(--aurora-bg)_40%,white)] dark:from-aurora-bg/80 dark:to-aurora-surface/90 border border-aurora-border/35 dark:border-aurora-border/40 shadow-[0_2px_12px_rgba(27,67,50,0.05)] font-medium text-aurora-text text-sm sm:text-base transition-[transform,box-shadow,border-color] duration-luxury ease-concierge hover:-translate-y-0.5 hover:border-aurora-primary/20 hover:shadow-card-lift"
                >
                  <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-aurora-primary/10 text-aurora-primary dark:bg-aurora-primary/14 dark:text-aurora-primary transition-[background-color] duration-luxury ease-concierge group-hover:bg-aurora-primary/14">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="min-w-0 break-words text-left leading-snug">{m.label}</span>
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
