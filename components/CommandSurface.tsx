"use client";

import Link from "next/link";
import { Search, UtensilsCrossed, RotateCcw, Apple, PiggyBank, Sparkles } from "lucide-react";
import { SearchDropdown } from "./SearchDropdown";
import { useStore } from "./StoreContext";
import { useAuth } from "./AuthProvider";
import { useMissionAware } from "./MissionAwareHome";
import { getTimeOfDay } from "@/lib/utils";

const ICON_MAP: Record<string, typeof UtensilsCrossed> = {
  "Dinner in 20 mins": UtensilsCrossed,
  "Dinner now": UtensilsCrossed,
  "Breakfast ideas": UtensilsCrossed,
  "Repeat last shop": RotateCcw,
  "Healthy options": Apple,
  "Under £25 shop": PiggyBank,
  "Recipe ideas": Sparkles,
  "Travel essentials": Sparkles,
  "Face wipes": Sparkles,
  "Travel size": Sparkles,
  "Packing checklist": Sparkles,
  "Explore more": Sparkles,
  "New arrivals": Sparkles,
  "Seasonal picks": Sparkles,
  "Fresh ingredients": UtensilsCrossed,
  "Quick meals": UtensilsCrossed,
};

/** Cold-start quick actions - contextual by time of day */
function getDefaultQuickActions(timeOfDay: string) {
  const base = [
    { label: "Dinner in 20 mins", href: "/catalogue?q=quick+dinner", icon: UtensilsCrossed },
    { label: "Repeat last shop", href: "/account/orders", icon: RotateCcw, authOnly: true },
    { label: "Healthy options", href: "/catalogue?q=healthy", icon: Apple },
    { label: "Under £25 shop", href: "/catalogue", icon: PiggyBank },
  ];
  if (timeOfDay === "evening") {
    return [
      { label: "Dinner now", href: "/catalogue?q=dinner", icon: UtensilsCrossed },
      ...base.filter((a) => a.label !== "Dinner in 20 mins"),
    ];
  }
  if (timeOfDay === "morning") {
    return [
      { label: "Breakfast ideas", href: "/catalogue?q=breakfast", icon: UtensilsCrossed },
      ...base.filter((a) => a.label !== "Dinner in 20 mins"),
    ];
  }
  return base;
}

/** Zero-state command surface with hero image - actionable intent capture + real retail warmth */
export function CommandSurface({ heroImageUrl }: { heroImageUrl?: string | null }) {
  const { store } = useStore();
  const { user } = useAuth();
  const homeData = useMissionAware();
  const timeOfDay = getTimeOfDay();

  const rawActions = homeData?.quickActions?.length
    ? homeData.quickActions.map((a) => ({
        label: a.label,
        href: a.href,
        icon: ICON_MAP[a.label] ?? Sparkles,
        authOnly: a.href === "/account/orders",
      }))
    : getDefaultQuickActions(timeOfDay);

  const quickActions = rawActions.filter((a) => !a.authOnly || user);

  const content = (
    <div className="relative z-10 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-aurora-text text-center mb-3 drop-shadow-sm">
        What are you shopping for today?
      </h1>
      <p className="text-aurora-muted/90 text-center text-base sm:text-lg mb-8 font-medium">
        Let&apos;s get you there fast
      </p>

      {/* Command bar - search + intent (z-20 so dropdown appears above Quick starts) */}
      <div className="relative z-20 mb-8">
        {store ? (
          <div
            className="rounded-2xl border border-white/60 bg-white/95 backdrop-blur-sm shadow-xl shadow-black/5 focus-within:border-aurora-primary/60 focus-within:ring-2 focus-within:ring-aurora-primary/20 transition-all"
            data-command-search
          >
            <SearchDropdown
              placeholder='e.g. "pasta dinner", "weekly shop", "quick snacks"'
              vendorId={store.id}
              fullWidth
            />
          </div>
        ) : (
          <Link
            href="/location"
            className="flex items-center gap-3 w-full px-6 py-4 rounded-2xl border-2 border-dashed border-white/50 bg-white/80 backdrop-blur-sm text-aurora-muted hover:text-aurora-text hover:border-aurora-primary/40 transition-all"
          >
            <Search className="w-5 h-5 shrink-0" />
            <span>Set location to search products</span>
          </Link>
        )}
      </div>

      {/* Quick starts - Holmes-influenced when inference exists, else time-of-day defaults */}
      <div className="relative z-0">
        <p className="text-xs font-semibold text-aurora-muted/90 uppercase tracking-widest mb-4">
          Quick starts
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white/90 backdrop-blur-sm border border-white/60 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-aurora-primary/10 hover:border-aurora-primary/40 hover:bg-white transition-all text-sm font-semibold text-aurora-text"
              >
                <Icon className="w-4 h-4 text-aurora-primary" />
                {action.label}
              </Link>
            );
          })}
          {!quickActions.some((a) => a.label === "Recipe ideas") && (
            <Link
              href="/catalogue?q=recipe"
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white/90 backdrop-blur-sm border border-white/60 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-aurora-primary/10 hover:border-aurora-primary/40 hover:bg-white transition-all text-sm font-semibold text-aurora-text"
            >
              <Sparkles className="w-4 h-4 text-aurora-primary" />
              Recipe ideas
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  if (heroImageUrl) {
    return (
      <section className="relative min-h-[420px] sm:min-h-[480px] py-16 sm:py-24 px-4 sm:px-6 overflow-hidden flex flex-col justify-center">
        {/* Hero image - full bleed, subtle scale for edge bleed */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${heroImageUrl})` }}
          aria-hidden
        />
        {/* Overlay - softer than before, lets image breathe for premium feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/60 to-white/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-aurora-bg/40 via-transparent to-transparent" />
        {content}
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-b from-aurora-surface to-aurora-bg border-b border-aurora-border">
      {content}
    </section>
  );
}
