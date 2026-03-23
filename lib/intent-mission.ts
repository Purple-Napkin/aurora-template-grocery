/**
 * Cooking-related Holmes mission keys — full recipe home takeover only when these + high confidence.
 */
export const COOKING_MISSION_KEYS = new Set([
  "recipe_mission",
  "combo_mission",
  "cook_dinner",
  "cook_dinner_tonight",
]);

export type MissionBand = "low" | "medium" | "high";

export function isCookingMissionKey(key: string | undefined): boolean {
  if (!key) return true;
  return COOKING_MISSION_KEYS.has(key);
}

export function shouldFullRecipeHomeTakeover(params: {
  mode: string | undefined;
  recipeSlug: string | undefined;
  recipeTitle: string | undefined;
  band: MissionBand | undefined;
  missionKey: string | undefined;
}): boolean {
  if (params.mode !== "recipe_mission" || !params.recipeSlug?.trim() || !params.recipeTitle?.trim()) {
    return false;
  }
  if (params.band !== "high") return false;
  return isCookingMissionKey(params.missionKey);
}

export function shouldMediumRecipeCompletionRail(params: {
  mode: string | undefined;
  recipeSlug: string | undefined;
  recipeTitle: string | undefined;
  band: MissionBand | undefined;
  missionKey: string | undefined;
}): boolean {
  if (params.mode !== "recipe_mission" || !params.recipeSlug?.trim() || !params.recipeTitle?.trim()) {
    return false;
  }
  if (params.band !== "medium") return false;
  return isCookingMissionKey(params.missionKey);
}

/** Travel missions — `urgent_replenishment` is grocery “in a hurry” / essentials, not trip prep (see hero + presence bar). */
export const TRAVEL_MISSION_KEYS = new Set(["travel_prep"]);

export function isTravelLikeMission(key: string | undefined): boolean {
  if (!key) return false;
  return TRAVEL_MISSION_KEYS.has(key);
}

/** Top-up / essentials missions — pantry-style hero. */
export const TOPUP_MISSION_KEYS = new Set([
  "routine_shop",
  "top_up",
  "quick_topup",
  "essentials",
  "urgent_replenishment",
]);

export function isTopUpMissionKey(key: string | undefined): boolean {
  if (!key) return false;
  return TOPUP_MISSION_KEYS.has(key);
}

/** Meal / time-of-day trust lines from the API that contradict a travel mission headline + CTA. */
function mealTimeTrustMisfitForTravel(summary: string): boolean {
  return (
    /because it'?s (dinner|breakfast|lunch) time/i.test(summary) ||
    /^Breakfast ideas for your morning/i.test(summary) ||
    /^Lunch ideas for your meal/i.test(summary) ||
    /^Cooking tonight\?/i.test(summary)
  );
}

/**
 * Single trust line for mission bars: must agree with `key` (headline/subline vs CTA).
 * Replaces API summary when it is meal/time copy but the mission is travel (or trip copy for cooking).
 */
export function alignedMissionTrustLine(
  key: string | undefined,
  label: string,
  apiSummary: string | undefined,
  hasCartItems: boolean
): string {
  const s = apiSummary?.trim() ?? "";

  if (isTravelLikeMission(key)) {
    if (!s || mealTimeTrustMisfitForTravel(s)) {
      return "Planning a trip? We've picked travel essentials.";
    }
    return s;
  }

  if (key && isCookingMissionKey(key)) {
    if (s && /^Planning a trip/i.test(s)) {
      return hasCartItems
        ? "Based on items in your basket and recent activity."
        : "Based on your search and browsing.";
    }
    if (s) return s;
    return hasCartItems
      ? "Based on items in your basket and recent activity."
      : "Based on your search and browsing.";
  }

  if (s) return s;
  return hasCartItems
    ? "Based on items in your basket and recent activity."
    : "Based on your search and browsing.";
}
