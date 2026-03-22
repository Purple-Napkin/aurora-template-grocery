"use client";

import { RecipePageView } from "./RecipePageView";

interface RecipeIngredientsSectionProps {
  recipeSlug: string;
  recipeTitle: string;
  currency?: string;
  /** Medium-confidence home: slimmer rail below main merchandising. */
  compact?: boolean;
}

/**
 * Home-page section showing recipe ingredients and products when Holmes infers a recipe mission.
 */
export function RecipeIngredientsSection({
  recipeSlug,
  recipeTitle,
  currency = "GBP",
  compact = false,
}: RecipeIngredientsSectionProps) {
  return (
    <section
      className={compact ? "py-6" : "py-8"}
      data-holmes={compact ? "recipe-mission-rail-compact" : "recipe-mission-section"}
    >
      <RecipePageView
        recipeSlug={recipeSlug}
        recipeTitle={recipeTitle}
        currency={currency}
        compact={compact}
        embeddedTitle
      />
    </section>
  );
}
