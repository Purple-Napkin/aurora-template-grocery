"use client";

import Link from "next/link";
import { Search, UtensilsCrossed, RotateCcw, Apple, PiggyBank, Sparkles } from "lucide-react";
import { SearchDropdown, useStore, useAuth } from "aurora-starter-core";
import { useDietaryExclusions } from "./DietaryExclusionsContext";
import { getRecipeSuggestion } from "@/lib/cart-intelligence";
import { useMissionAware } from "./MissionAwareHome";
import { RecipeMissionHero } from "./RecipeMissionHero";
import { getTimeOfDay } from "aurora-starter-core";
import { holmesMissionLockCombo } from "aurora-starter-core";
import { shouldLockRecipeMissionForMissionPill } from "@/lib/holmes-mission-lock";

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

/** Hero: logo left, shopping form right. Responsive, elegant. */
export function CommandSurface({ logoUrl }: { logoUrl?: string | null }) {
  const { store } = useStore();
  const { user } = useAuth();
  const { excludeDietary } = useDietaryExclusions();
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

  const isRecipeMission =
    homeData?.mode === "recipe_mission" && homeData.recipeSlug && homeData.recipeTitle;

  const formContent = (
    <div className="relative z-10 w-full max-w-xl">
      {isRecipeMission && (
        <div className="mb-6">
          <RecipeMissionHero
            recipeTitle={homeData.recipeTitle!}
            recipeSlug={homeData.recipeSlug!}
            compact
          />
        </div>
      )}
      <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-aurora-text mb-3">
        {isRecipeMission ? "Or something else?" : `How can we assist you this ${timeOfDay}?`}
      </h1>
      <p className="text-aurora-muted text-base sm:text-lg mb-6 font-medium">
        {isRecipeMission ? "Let's get you there fast" : "Pick a mission or search below"}
      </p>

      {/* Primary: mission quick actions first */}
      <div className="relative z-20 mb-6">
        <p className="text-xs font-semibold text-aurora-muted uppercase tracking-widest mb-3">
          Start here
        </p>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const href = action.label === "Recipe ideas" ? "/recipes" : action.href;
            return (
              <Link
                key={action.label}
                href={href}
                onClick={() => {
                  if (shouldLockRecipeMissionForMissionPill(action.label, href)) holmesMissionLockCombo();
                }}
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-aurora-surface border border-aurora-border shadow-sm hover:border-aurora-primary/40 hover:shadow-md transition-all text-sm font-semibold text-aurora-text"
              >
                <Icon className="w-4 h-4 text-aurora-primary" />
                {action.label}
              </Link>
            );
          })}
          {!quickActions.some((a) => a.label === "Recipe ideas") && (
            <Link
              href="/recipes"
              onClick={() => holmesMissionLockCombo()}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-aurora-surface border border-aurora-border shadow-sm hover:border-aurora-primary/40 hover:shadow-md transition-all text-sm font-semibold text-aurora-text"
            >
              <Sparkles className="w-4 h-4 text-aurora-primary" />
              Recipe ideas
            </Link>
          )}
        </div>
      </div>

      {/* Secondary: search as tool, not entry point */}
      <div className="relative z-10">
        <p className="text-xs font-semibold text-aurora-muted uppercase tracking-widest mb-2">
          Search the store
        </p>
        {store ? (
          <div
            className="rounded-xl border border-aurora-border/80 bg-aurora-surface/80 focus-within:border-aurora-primary/50 focus-within:ring-1 focus-within:ring-aurora-primary/20 transition-all max-w-md"
            data-command-search
          >
            <SearchDropdown
              placeholder="milk, pasta, bananas…"
              vendorId={store.id}
              fullWidth
              excludeDietary={excludeDietary}
              getRecipeSuggestion={getRecipeSuggestion}
            />
          </div>
        ) : (
          <Link
            href="/location"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-aurora-border bg-aurora-surface/80 text-aurora-muted hover:text-aurora-text hover:border-aurora-primary/40 transition-all text-sm"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span>Set location to search</span>
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-gradient-to-b from-aurora-surface to-aurora-bg">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-12 xl:gap-16">
        {/* Logo - always on left, with subtle well + texture anchor */}
        <div className="flex-1 min-w-0 order-2 lg:order-1 flex justify-center lg:justify-start w-full lg:min-w-[280px]">
          <Link
            href="/"
            className="logo-well block w-full max-w-[min(85vw,320px)] lg:max-w-full transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-aurora-primary/50 rounded-2xl p-4 sm:p-6 border border-aurora-border/60"
            aria-label="Home"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="w-full h-auto object-contain drop-shadow-sm
                  max-h-[clamp(7rem,40vw,12rem)] sm:max-h-[clamp(9rem,38vw,15rem)] md:max-h-[clamp(11rem,36vw,18rem)]
                  lg:max-h-[clamp(14rem,55vh,24rem)] xl:max-h-[clamp(16rem,58vh,28rem)] 2xl:max-h-[clamp(18rem,60vh,32rem)]"
              />
            ) : (
              <span className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-aurora-text">
                {process.env.NEXT_PUBLIC_SITE_NAME ?? "Store"}
              </span>
            )}
          </Link>
        </div>

        {/* Form - right on desktop */}
        <div className="flex-1 min-w-0 order-1 lg:order-2 flex justify-center lg:justify-end w-full lg:min-w-[320px]">
          {formContent}
        </div>
      </div>
    </section>
  );
}
