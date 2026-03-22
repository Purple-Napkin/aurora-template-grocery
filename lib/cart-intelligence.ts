/**
 * Cart intelligence - meal completion, affinity pairs, basket composition.
 * Powers "Complete your meal", "You might have forgotten", "Live basket affinity", and basket summary.
 */

/** Triggers for "Complete your meal" - when cart has these, suggest complements */
export const MEAL_TRIGGERS: Record<string, { meal: string; searchTerms: string[] }> = {
  "curry paste": { meal: "curry", searchTerms: ["rice", "coconut milk", "naan"] },
  "curry sauce": { meal: "curry", searchTerms: ["rice", "naan"] },
  "pasta sauce": { meal: "pasta", searchTerms: ["pasta", "parmesan", "olive oil"] },
  "tomato sauce": { meal: "pasta", searchTerms: ["pasta", "parmesan"] },
  "soy sauce": { meal: "stir fry", searchTerms: ["rice", "noodles", "vegetables"] },
  "paella": { meal: "paella", searchTerms: ["rice", "saffron", "seafood"] },
  "spaghetti": { meal: "pasta", searchTerms: ["pasta", "parmesan", "olive oil", "tomato"] },
  "pasta": { meal: "pasta", searchTerms: ["pasta", "parmesan", "olive oil"] },
  "risotto": { meal: "risotto", searchTerms: ["rice", "parmesan", "stock"] },
};

/** Affinity pairs for "You might have forgotten" - when cart has X, suggest Y */
export const AFFINITY_PAIRS: Record<string, string[]> = {
  bread: ["butter", "milk", "jam"],
  "white bread": ["butter", "milk"],
  "wholemeal bread": ["butter", "milk"],
  cereal: ["milk"],
  "breakfast cereal": ["milk"],
  pasta: ["pasta sauce", "olive oil", "parmesan"],
  rice: ["soy sauce", "butter"],
  eggs: ["bread", "butter", "milk"],
  milk: ["bread", "eggs", "cereal"],
  coffee: ["milk", "sugar"],
  tea: ["milk", "sugar"],
  biscuits: ["milk"],
  cookies: ["milk"],
};

/** Recipe phrases for predictive search - show "Paella ingredients?" when typing "pae" */
export const RECIPE_SUGGESTIONS = [
  "paella ingredients",
  "curry ingredients",
  "pasta ingredients",
  "spaghetti ingredients",
  "risotto ingredients",
  "stir fry ingredients",
  "steak ingredients",
  "chicken ingredients",
  "salmon ingredients",
  "soup ingredients",
] as const;

/** Recipe search terms → canonical recipe slug for getRecipeTitle (e.g. spaghetti, linguine → pasta) */
const RECIPE_WORD_MAP: Record<string, string> = {
  paella: "paella",
  curry: "curry",
  pasta: "pasta",
  spaghetti: "pasta",
  linguine: "pasta",
  penne: "pasta",
  risotto: "risotto",
  "stir fry": "stir fry",
  "stir-fry": "stir fry",
  steak: "steak",
  chicken: "chicken",
  salmon: "salmon",
  soup: "soup",
};

/** Match query prefix to a recipe suggestion for predictive search. Also detects "X recipe" and "recipe for X" intent. */
export function getRecipeSuggestion(query: string): string | null {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return null;

  const recipeMatch = q.match(/^(.+?)\s+recipe$/);
  if (recipeMatch) {
    const dish = recipeMatch[1].trim();
    if (dish.length >= 2 && dish.length <= 30 && /^[a-z\s\-']+$/i.test(dish)) {
      const title = dish.replace(/\s+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
      return `${title} ingredients?`;
    }
  }
  const recipeForMatch = q.match(/recipe\s+(?:for\s+)?(.+)$/);
  if (recipeForMatch) {
    const dish = recipeForMatch[1].trim();
    if (dish.length >= 2 && dish.length <= 30 && /^[a-z\s\-']+$/i.test(dish)) {
      const title = dish.replace(/\s+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
      return `${title} ingredients?`;
    }
  }

  const match = RECIPE_SUGGESTIONS.find((r) => r.startsWith(q) || q.startsWith(r.split(" ")[0]));
  return match ? `${match}?` : null;
}

/** True if `token` appears as a whole word (avoids "oil" matching "boil" / vague description noise). */
export function matchesRecipeHintToken(haystack: string, token: string): boolean {
  const t = token.trim().toLowerCase();
  if (t.length < 2) return false;
  const esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, "i").test(haystack);
}

/** Pantry / vague tokens — count for little when ranking against URL ingredient hints. */
const LIGHT_RECIPE_HINT_TOKENS = new Set([
  "oil",
  "olive",
  "salt",
  "pepper",
  "water",
  "stock",
  "garlic",
  "butter",
  "sugar",
  "herbs",
]);

/**
 * Rank Holmes cached recipes when `?ingredients=` (or similar) is provided.
 * First hint is the theme (e.g. pasta); it must appear in slug/title for a recipe to stay in the
 * primary list when any recipe matches that bar — otherwise results drift to anything mentioning "olive oil".
 */
export function rankRecipesByIngredientHints(
  recipes: Array<{ slug: string; title: string; description: string | null }>,
  hints: string[],
  mealFromCart: string | null
): Array<{ slug: string; title: string }> {
  const cleaned = hints.map((h) => h.trim()).filter((h) => h.length >= 2);
  if (cleaned.length === 0) {
    return recipes.map((r) => ({ slug: r.slug, title: r.title }));
  }
  const theme = cleaned[0]!.toLowerCase();
  const rest = cleaned.slice(1).map((h) => h.toLowerCase());
  const mealLower = mealFromCart?.toLowerCase() ?? "";

  const score = (r: { slug: string; title: string; description: string | null }) => {
    let s = 0;
    const slug = r.slug.toLowerCase();
    const title = (r.title ?? "").toLowerCase();
    const desc = (r.description ?? "").toLowerCase();
    const head = `${slug} ${title}`;
    const all = `${head} ${desc}`;

    if (
      mealLower &&
      (matchesRecipeHintToken(slug, mealLower) || matchesRecipeHintToken(title, mealLower))
    ) {
      s += 160;
    }

    if (matchesRecipeHintToken(head, theme)) s += 320;
    else if (matchesRecipeHintToken(all, theme)) s += 75;

    for (const w of rest) {
      if (w.length < 2) continue;
      if (LIGHT_RECIPE_HINT_TOKENS.has(w)) {
        if (matchesRecipeHintToken(all, w)) s += 4;
        continue;
      }
      if (matchesRecipeHintToken(head, w)) s += 48;
      else if (matchesRecipeHintToken(all, w)) s += 14;
    }
    return s;
  };

  const sorted = [...recipes].sort((a, b) => score(b) - score(a));
  const themeInHead = (r: (typeof recipes)[number]) =>
    matchesRecipeHintToken(`${r.slug} ${r.title}`.toLowerCase(), theme);
  const themeAnywhere = (r: (typeof recipes)[number]) =>
    matchesRecipeHintToken(
      `${r.slug} ${r.title} ${r.description ?? ""}`.toLowerCase(),
      theme
    );
  const strong = sorted.filter(themeInHead);
  const relaxed = sorted.filter(themeAnywhere);
  const chosen = strong.length > 0 ? strong : relaxed.length > 0 ? relaxed : sorted;
  return chosen.map((r) => ({ slug: r.slug, title: r.title }));
}

/** Extract recipe title from search query for catalogue - matches "paella", "spaghetti", "pasta", etc. */
export function getRecipeTitle(q: string): string | null {
  const lower = q.trim().toLowerCase();
  if (!lower) return null;
  for (const [word, recipe] of Object.entries(RECIPE_WORD_MAP)) {
    if (lower === word || lower.startsWith(word + " ") || lower.endsWith(" " + word) || word.startsWith(lower) || (word.length >= 4 && lower.startsWith(word.slice(0, 4)))) {
      return recipe.charAt(0).toUpperCase() + recipe.slice(1);
    }
  }
  const match = RECIPE_SUGGESTIONS.find(
    (r) => r.startsWith(lower) || lower.startsWith(r.split(" ")[0]) || lower.includes(r.split(" ")[0])
  );
  return match ? match.split(" ")[0].charAt(0).toUpperCase() + match.split(" ")[0].slice(1) : null;
}

/** Distinct search terms to pass as `/for-you/recipes?ingredients=` when leaving recipe-mode catalogue search. */
export function recipeSearchIngredientHints(q: string): string[] {
  const expanded = expandRecipeSearchQuery(q.trim());
  const terms = expanded.split(/\s+/).map((t) => t.trim()).filter(Boolean);
  return [...new Set(terms)];
}

/** Expand search query for recipes - "paell" or "paella" → "paella rice saffron seafood" for better Meilisearch hits */
export function expandRecipeSearchQuery(q: string): string {
  const lower = q.trim().toLowerCase();
  if (!lower || lower.length < 2) return q;
  for (const [recipePhrase, data] of Object.entries(MEAL_TRIGGERS)) {
    const recipeWord = recipePhrase.split(" ")[0];
    if (lower.includes(recipeWord) || recipeWord.startsWith(lower) || lower.startsWith(recipeWord)) {
      const terms = [recipeWord, ...data.searchTerms];
      return [...new Set(terms)].join(" ");
    }
  }
  return q;
}

/** Product name patterns that map to affinity keys (partial match) */
const AFFINITY_KEYS = Object.keys(AFFINITY_PAIRS);

/** Check if cart items trigger "Complete your meal" */
export function getMealToComplete(cartItemNames: string[]): { meal: string; searchTerms: string[] } | null {
  const lower = cartItemNames.map((n) => n.toLowerCase());
  for (const [trigger, data] of Object.entries(MEAL_TRIGGERS)) {
    if (lower.some((name) => name.includes(trigger))) return data;
  }
  return null;
}

/** Get "forgotten" suggestions based on cart */
export function getForgottenSuggestions(cartItemNames: string[]): string[] {
  const suggestions = new Set<string>();
  const lower = cartItemNames.map((n) => n.toLowerCase());

  for (const key of AFFINITY_KEYS) {
    if (lower.some((name) => name.includes(key))) {
      for (const s of AFFINITY_PAIRS[key]) {
        if (!lower.some((name) => name.includes(s))) suggestions.add(s);
      }
    }
  }
  return Array.from(suggestions).slice(0, 4);
}

/** Get affinity suggestions for a freshly added item (for live "People who bought X also added") */
export function getLiveAffinityForItem(itemName: string): string[] {
  const lower = itemName.toLowerCase();
  for (const [key, suggestions] of Object.entries(AFFINITY_PAIRS)) {
    if (lower.includes(key)) return suggestions.slice(0, 3);
  }
  return [];
}

/** Infer basket composition summary from cart items */
export function getBasketCompositionSummary(cartItemNames: string[]): string {
  const lower = cartItemNames.map((n) => n.toLowerCase());
  const parts: string[] = [];

  const hasMeal = lower.some((n) =>
    [
      "pasta",
      "rice",
      "curry",
      "sauce",
      "meat",
      "beef",
      "mince",
      "steak",
      "lamb",
      "pork",
      "fish",
      "chicken",
      "salmon",
      "prawn",
      "vegetables",
      "potato",
      "onion",
      "garlic",
      "cheese",
      "feta",
      "olive",
      "egg",
    ].some((m) => n.includes(m))
  );
  const hasBreakfast =
    lower.some((n) => ["bread", "cereal", "milk", "eggs", "coffee", "tea", "jam", "butter"].some((m) => n.includes(m)));
  const hasSnacks = lower.some((n) =>
    ["crisps", "chocolate", "biscuits", "cookies", "nuts", "snack"].some((m) => n.includes(m))
  );
  const hasDrinks = lower.some((n) =>
    ["juice", "milk", "water", "soda", "coffee", "tea", "drink"].some((m) => n.includes(m))
  );

  if (hasMeal) parts.push("dinner");
  if (hasBreakfast) parts.push("breakfast");
  if (hasSnacks) parts.push("snacks");
  if (hasDrinks && !parts.includes("breakfast")) parts.push("drinks");

  if (parts.length === 0) return "Your weekly shop";
  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(", ");
}
