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

/** Travel / hurry missions — suppress recipe-first chrome. */
export const TRAVEL_MISSION_KEYS = new Set(["travel_prep", "urgent_replenishment"]);

export function isTravelLikeMission(key: string | undefined): boolean {
  if (!key) return false;
  return TRAVEL_MISSION_KEYS.has(key);
}
