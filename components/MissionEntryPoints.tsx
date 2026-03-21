"use client";

import Link from "next/link";
import { UtensilsCrossed, Cookie, Sparkles, Salad, Wine, MapPin } from "lucide-react";
import { useMissionAware } from "./MissionAwareHome";
import { holmesMissionLockCombo } from "aurora-starter-core";
import { shouldLockRecipeMissionForMissionPill } from "@/lib/holmes-mission-lock";

const DEFAULT_MISSIONS = [
  { label: "Cook dinner", href: "/catalogue?q=dinner", icon: UtensilsCrossed },
  { label: "Quick snacks", href: "/catalogue?q=snacks", icon: Cookie },
  { label: "Top up essentials", href: "/catalogue?q=essentials", icon: Sparkles },
  { label: "Healthy week", href: "/catalogue?q=healthy", icon: Salad },
  { label: "Hosting / guests", href: "/catalogue?q=wine+cheese", icon: Wine },
] as const;

const ICON_MAP: Record<string, typeof UtensilsCrossed> = {
  "Cook dinner": UtensilsCrossed,
  "Quick snacks": Cookie,
  "Top up essentials": Sparkles,
  "Healthy week": Salad,
  "Hosting / guests": Wine,
  "Travel essentials": MapPin,
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
      <h2 className="text-xs font-semibold text-aurora-muted uppercase tracking-widest mb-4">
        Start here
      </h2>
      <div className="flex flex-wrap gap-3">
        {missions.map((m) => {
          const Icon = m.icon;
          const href = m.label === "Recipe ideas" ? "/recipes" : m.href;
          return (
            <Link
              key={m.label}
              href={href}
              onClick={() => {
                if (shouldLockRecipeMissionForMissionPill(m.label, href)) holmesMissionLockCombo();
              }}
              className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-aurora-surface border border-aurora-border/80 shadow-sm hover:border-aurora-primary/40 hover:shadow-md hover:shadow-aurora-primary/5 transition-all font-medium text-aurora-text"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-aurora-primary/10 text-aurora-primary">
                <Icon className="w-5 h-5" />
              </span>
              {m.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
