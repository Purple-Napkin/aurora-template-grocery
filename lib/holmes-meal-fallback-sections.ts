import type { StoreContentSection } from "@/components/storeContentBlocksUi";

/**
 * Holmes `home-personalization` fallback rails use these titles with **product** grids.
 * On the cart page we strip them and show recipe cards instead (`CartTonightRecipes`).
 */
export const HOLMES_MEAL_PRODUCT_FALLBACK_TITLES = new Set([
  "Breakfast ideas",
  "Lunch picks",
  "Meals for tonight",
]);

export function isHolmesMealProductFallbackSection(sec: StoreContentSection): boolean {
  if (sec.type !== "meals") return false;
  const t = (sec as { title?: string }).title?.trim();
  return t ? HOLMES_MEAL_PRODUCT_FALLBACK_TITLES.has(t) : false;
}
