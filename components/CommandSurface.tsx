"use client";

import Link from "next/link";
import {
  Search,
  UtensilsCrossed,
  RotateCcw,
  Apple,
  PiggyBank,
  Sparkles,
  Salad,
} from "lucide-react";
import {
  SearchDropdown,
  useStore,
  useAuth,
  useVerticalProfile,
} from "@aurora-studio/starter-core";
import { useDietaryExclusions } from "./DietaryExclusionsContext";
import { getRecipeSuggestion } from "@/lib/cart-intelligence";
import { useMissionAware } from "./MissionAwareHome";
import { RecipeMissionHero } from "./RecipeMissionHero";
import { getTimeOfDay } from "@aurora-studio/starter-core";
import { holmesMissionLockCombo } from "@aurora-studio/starter-core";
import { shouldLockRecipeMissionForMissionPill } from "@/lib/holmes-mission-lock";
import { shouldFullRecipeHomeTakeover } from "@/lib/intent-mission";
import { resolveHeroFromMission } from "@/lib/hero-intent";
import { IntentHeroPanel } from "@/components/intent/IntentHeroPanel";
import {
  fullWidthHeroBandClass,
  splitHeroRowGapClass,
  splitHeroSectionPaddingClass,
  type HeroSize,
} from "@/lib/commandSurfaceHeroStyles";

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
  "Bakery & spreads": Apple,
  "Coffee & juice": Sparkles,
  "Sandwiches & salads": Salad,
};

type LocalQuickAction = {
  label: string;
  href: string;
  icon: typeof UtensilsCrossed;
  authOnly?: boolean;
};

function getDefaultQuickActions(timeOfDay: string): LocalQuickAction[] {
  const base: LocalQuickAction[] = [
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

export function CommandSurface({
  heroLayout = "split",
  heroSize = "default",
}: {
  /** @deprecated Tenant logo/hero image — intent hero photography replaces the split logo well. */
  heroImageUrl?: string | null;
  heroLayout?: "split" | "full_width";
  heroSize?: HeroSize;
}) {
  const { store } = useStore();
  const { user } = useAuth();
  const { excludeDietary } = useDietaryExclusions();
  const { dietaryFilteringEnabled } = useVerticalProfile();
  const excludeForSearch = dietaryFilteringEnabled ? excludeDietary : [];
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
    !!homeData &&
    shouldFullRecipeHomeTakeover({
      mode: homeData.mode,
      recipeSlug: homeData.recipeSlug,
      recipeTitle: homeData.recipeTitle,
      band: homeData.activeMission?.band,
      missionKey: homeData.activeMission?.key,
    });

  const hero = resolveHeroFromMission(
    homeData?.activeMission?.key,
    homeData?.activeMission?.band
  );

  const missionChipClass =
    "inline-flex min-h-[3rem] items-center gap-2.5 px-6 py-3.5 rounded-full bg-white/75 backdrop-blur-md dark:bg-white/[0.06] border border-white/80 dark:border-white/10 text-sm font-medium text-aurora-text shadow-[0_2px_14px_rgba(27,67,50,0.06)] transition-[transform,box-shadow,border-color] duration-luxury ease-concierge hover:-translate-y-0.5 hover:border-aurora-primary/22 hover:shadow-[0_8px_28px_rgba(47,93,69,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-aurora-bg";

  const formContent = (
    <div
      className="relative z-10 w-full max-w-xl rounded-[1.35rem] overflow-visible border border-aurora-border/28 bg-white/82 backdrop-blur-xl dark:bg-aurora-surface/78 dark:border-aurora-border/22 shadow-[0_4px_24px_rgba(27,67,50,0.07),0_24px_64px_rgba(27,67,50,0.05)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
      >
      <div className="p-6 sm:p-8 lg:p-10">
        {isRecipeMission && (
          <div className="mb-6">
            <RecipeMissionHero
              recipeTitle={homeData.recipeTitle!}
              recipeSlug={homeData.recipeSlug!}
              compact
            />
          </div>
        )}
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-aurora-text mb-4">
          {isRecipeMission ? "Or something else?" : hero.title}
        </h1>
      {isRecipeMission ? (
        <p className="text-aurora-muted text-base sm:text-lg mb-7 font-normal leading-relaxed">
          Let’s get you there fast
        </p>
      ) : hero.caption ? (
        <div className="text-aurora-muted text-base sm:text-lg mb-7 font-normal leading-relaxed space-y-1.5">
          <p>{hero.subtitle}</p>
          <p className="text-sm text-aurora-muted/90">{hero.caption}</p>
        </div>
      ) : (
        <p className="text-aurora-muted text-base sm:text-lg mb-7 font-normal leading-relaxed">{hero.subtitle}</p>
      )}

        {/* Primary: mission quick actions first */}
        <div className="relative z-20 mb-8">
          <p className="text-[0.6875rem] font-medium text-aurora-muted/90 uppercase tracking-[0.14em] mb-4">
            Start here
          </p>
          <div className="flex flex-wrap gap-3.5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const href = action.label === "Recipe ideas" ? "/for-you/recipes" : action.href;
              return (
                <Link
                  key={action.label}
                  href={href}
                  onClick={() => {
                    if (shouldLockRecipeMissionForMissionPill(action.label, href)) holmesMissionLockCombo();
                  }}
                  className={missionChipClass}
                >
                  <Icon className="h-4 w-4 shrink-0 text-aurora-primary" />
                  {action.label === "Recipe ideas" ? "Meal ideas (optional)" : action.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Secondary: search as tool, not entry point */}
        <div className="relative z-10">
          <p className="text-[0.6875rem] font-medium text-aurora-muted/90 uppercase tracking-[0.14em] mb-3">
            Find what you need
          </p>
          {store ? (
            <div
              className="rounded-2xl max-w-lg border border-aurora-border/40 bg-[color-mix(in_srgb,var(--aurora-surface)_92%,var(--aurora-bg))] dark:bg-aurora-bg/90 shadow-inset-well dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_12px_rgba(0,0,0,0.2)] focus-within:border-aurora-primary/28 focus-within:shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_0_0_1px_color-mix(in_srgb,var(--aurora-primary)_16%,transparent),0_12px_40px_rgba(47,93,69,0.11)] transition-[box-shadow,border-color] duration-luxury ease-concierge overflow-visible relative z-30 pl-1 py-0.5"
              data-command-search
            >
              <SearchDropdown
                placeholder="What do you need today?"
                vendorId={store.id}
                fullWidth
                variant="embedded"
                excludeDietary={excludeForSearch}
                getRecipeSuggestion={getRecipeSuggestion}
                getComboHref={(slug) => `/recipes/${encodeURIComponent(slug)}`}
              />
            </div>
          ) : (
            <Link
              href="/location"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-dashed border-aurora-border/60 bg-white/60 backdrop-blur-sm text-aurora-muted hover:text-aurora-text hover:border-aurora-primary/35 transition-[color,border-color,box-shadow] duration-luxury ease-concierge text-sm"
            >
              <Search className="w-4 h-4 shrink-0" />
              <span>Set location to search</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  if (heroLayout === "full_width") {
    return (
      <section className="command-surface-hero bg-gradient-to-b from-aurora-surface to-aurora-bg">
        <div
          className={`relative w-full overflow-hidden bg-aurora-surface/75 border-b border-aurora-border/50 ${fullWidthHeroBandClass(heroSize)}`}
        >
          <div className="absolute inset-0">
            <IntentHeroPanel hero={hero} edgeToEdge />
          </div>
        </div>
        <div className="relative z-50 max-w-6xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-14 lg:py-20 flex justify-center lg:justify-start">
          {formContent}
        </div>
      </section>
    );
  }

  return (
    <section
      className={`command-surface-hero px-4 sm:px-6 bg-gradient-to-b from-aurora-surface to-aurora-bg ${splitHeroSectionPaddingClass(heroSize)}`}
    >
      <div
        className={`max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center lg:items-start ${splitHeroRowGapClass(heroSize)}`}
      >
        <div className="min-w-0 order-2 lg:order-1 flex justify-center lg:justify-start items-start w-full lg:min-w-[280px] justify-self-center lg:justify-self-start">
          <IntentHeroPanel hero={hero} />
        </div>

        <div className="relative z-50 min-w-0 order-1 lg:order-2 flex justify-center lg:justify-end w-full lg:min-w-[320px] justify-self-center lg:justify-self-end">
          {formContent}
        </div>
      </div>
    </section>
  );
}
