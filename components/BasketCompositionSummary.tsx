"use client";

import { getBasketCompositionSummary } from "@/lib/cart-intelligence";
import type { CartItem } from "aurora-starter-core";
import { useMissionAware } from "@/components/MissionAwareHome";

const RECIPE_BAR_MISSIONS = new Set([
  "combo_mission",
  "recipe_mission",
  "cook_dinner",
  "cook_dinner_tonight",
]);

export function BasketCompositionSummary({ items }: { items: CartItem[] }) {
  const missionData = useMissionAware();
  const key = missionData?.activeMission?.key;
  const summary =
    key && RECIPE_BAR_MISSIONS.has(key)
      ? `Recipes & ingredients (${missionData?.activeMission?.label ?? "Cooking"})`
      : getBasketCompositionSummary(items.map((i) => i.name));
  return (
    <p className="text-sm text-aurora-muted mb-6">
      Your shop: {summary}
    </p>
  );
}
