/**
 * Easter eggs & delightful tips - little touches that show someone cared.
 * Floating buddy tips live in `@aurora-studio/starter-core` (`StoreBuddy` / `verticalProfile`).
 */

/** Cart tips: match item name patterns, suggest switching to save money */
export const BASKET_SAVER_TIPS: Array<{
  pattern: RegExp | ((name: string) => boolean);
  tip: string;
  searchHint?: string;
}> = [
  {
    pattern: /olive oil|extra virgin|evoo/i,
    tip: "Using olive oil for everyday cooking? Our standard range works just as well and often costs less!",
    searchHint: "olive oil",
  },
  {
    pattern: /premium|gourmet|artisan|finest/i,
    tip: "Love the quality but watching the budget? Try our everyday range – many shoppers say they can't tell the difference.",
    searchHint: undefined,
  },
  {
    pattern: /organic/i,
    tip: "Going organic where it matters most (like dairy and leafy greens) can save money while still eating well.",
  },
  {
    pattern: /branded|heinz|kellogg|nestlé/i,
    tip: "Our own brand versions are often made in the same factories. Worth a look if you're trying to trim the bill!",
  },
  {
    pattern: /ready meal|prepared|pre-cooked/i,
    tip: "Batch cooking at home can save a bundle. Our fresh ingredients make it easy!",
    searchHint: "fresh ingredients",
  },
  {
    pattern: /single serve|individual|snack pack/i,
    tip: "Buying larger packs and portioning at home usually works out cheaper. Your future self will thank you!",
  },
  {
    pattern: /sparkling water|fizzy water|soda water/i,
    tip: "A soda stream or our large bottles work out much cheaper than single cans. Fizz for days!",
    searchHint: "sparkling water",
  },
  {
    pattern: /coffee.*pod|capsule|nespresso/i,
    tip: "Reusable pods or our ground coffee can cut your coffee spend in half. Still delicious!",
    searchHint: "ground coffee",
  },
];

/** Find a basket saver tip that matches any cart item */
export function getBasketSaverTip(
  itemNames: string[]
): { tip: string; searchHint?: string } | null {
  const lower = itemNames.map((n) => n.toLowerCase());
  for (const { pattern, tip, searchHint } of BASKET_SAVER_TIPS) {
    const matches = lower.some((name) => {
      if (typeof pattern === "function") return pattern(name);
      return pattern.test(name);
    });
    if (matches) return { tip, searchHint };
  }
  return null;
}
