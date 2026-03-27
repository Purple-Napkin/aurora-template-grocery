import type { MissionBand } from "@/lib/intent-mission";
import {
  COOKING_MISSION_KEYS,
  isTopUpMissionKey,
  isTravelLikeMission,
} from "@/lib/intent-mission";

export type HeroIntent = "neutral" | "cooking" | "topup" | "travel";
export type HeroConfidence = "low" | "medium" | "high";

export type HeroVariant = {
  key: string;
  image: string;
  title: string;
  subtitle: string;
  /** Optional third line (e.g. travel high explainability). */
  caption?: string;
};

const H = {
  neutral: "/images/hero/fresh-produce.jpg",
  cookingMedium: "/images/hero/ingredients.jpg",
  cookingHigh: "/images/hero/finished-dish.jpg",
  travelMedium: "/images/hero/travel-essentials.jpg",
  travelHigh: "/images/hero/travel-packing.jpg",
  topup: "/images/hero/pantry.jpg",
} as const;

export const HERO_VARIANTS: Record<string, HeroVariant> = {
  neutral: {
    key: "neutral",
    image: H.neutral,
    title: "Shopping that adapts to what you need",
    subtitle: "Find what you need faster",
  },
  cookingMedium: {
    key: "cookingMedium",
    image: H.cookingMedium,
    title: "Looks like you might be cooking",
    subtitle: "We’ll help you finish faster",
  },
  cookingHigh: {
    key: "cookingHigh",
    image: H.cookingHigh,
    title: "Finish your dinner in one go",
    subtitle: "Add missing ingredients in one tap",
  },
  cookingBreakfastMedium: {
    key: "cookingBreakfastMedium",
    image: H.cookingMedium,
    title: "Looks like you’re building breakfast",
    subtitle: "We’ll help you finish faster",
  },
  cookingBreakfastHigh: {
    key: "cookingBreakfastHigh",
    image: H.cookingHigh,
    title: "Finish your breakfast in one go",
    subtitle: "Add missing items in one tap",
  },
  cookingLunchMedium: {
    key: "cookingLunchMedium",
    image: H.cookingMedium,
    title: "Looks like you’re building lunch",
    subtitle: "We’ll help you finish faster",
  },
  cookingLunchHigh: {
    key: "cookingLunchHigh",
    image: H.cookingHigh,
    title: "Finish your lunch in one go",
    subtitle: "Add missing items in one tap",
  },
  travelMedium: {
    key: "travelMedium",
    image: H.travelMedium,
    title: "Getting ready quickly?",
    subtitle: "We’ll help you finish faster",
  },
  travelHigh: {
    key: "travelHigh",
    image: H.travelHigh,
    title: "Ready for your trip",
    subtitle: "We’ve prioritised what you need",
    caption: "Based on your basket and location",
  },
  topup: {
    key: "topup",
    image: H.topup,
    title: "Quick top-up",
    subtitle: "Get essentials sorted in minutes",
  },
};

/** Map Holmes mission key to a coarse intent for hero selection. */
export function inferHeroIntent(missionKey: string | undefined): HeroIntent {
  if (!missionKey?.trim()) return "neutral";
  const k = missionKey.trim();
  if (isTravelLikeMission(k)) return "travel";
  if (k === "breakfast_mission" || k === "lunch_mission") return "cooking";
  if (COOKING_MISSION_KEYS.has(k)) return "cooking";
  if (isTopUpMissionKey(k)) return "topup";
  return "neutral";
}

export function missionBandToHeroConfidence(band: MissionBand | undefined): HeroConfidence {
  if (band === "medium" || band === "high") return band;
  return "low";
}

/**
 * Deterministic hero: low confidence always neutral (never “finished dish” / “trip ready” on weak signals).
 */
export function getHero(
  intent: HeroIntent,
  confidence: HeroConfidence,
  missionKey?: string | undefined
): HeroVariant {
  if (confidence === "low") {
    return HERO_VARIANTS.neutral;
  }
  if (intent === "cooking") {
    if (missionKey === "breakfast_mission") {
      return confidence === "high"
        ? HERO_VARIANTS.cookingBreakfastHigh
        : HERO_VARIANTS.cookingBreakfastMedium;
    }
    if (missionKey === "lunch_mission") {
      return confidence === "high"
        ? HERO_VARIANTS.cookingLunchHigh
        : HERO_VARIANTS.cookingLunchMedium;
    }
    return confidence === "high" ? HERO_VARIANTS.cookingHigh : HERO_VARIANTS.cookingMedium;
  }
  if (intent === "travel") {
    return confidence === "high" ? HERO_VARIANTS.travelHigh : HERO_VARIANTS.travelMedium;
  }
  if (intent === "topup") {
    return HERO_VARIANTS.topup;
  }
  return HERO_VARIANTS.neutral;
}

export function resolveHeroFromMission(
  missionKey: string | undefined,
  band: MissionBand | undefined
): HeroVariant {
  const intent = inferHeroIntent(missionKey);
  const confidence = missionBandToHeroConfidence(band);
  return getHero(intent, confidence, missionKey);
}
