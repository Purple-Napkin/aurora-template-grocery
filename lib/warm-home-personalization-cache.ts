import { getHomePersonalizationProcessCached } from "./home-personalization-process-cache";

/** CMS page + region + category slug — warmed with no dietary exclusions at server boot. */
const SLOTS: readonly [contentPage: string, contentRegion: string, categorySlug: string][] = [
  ["home", "home_main_feed", ""],
  ["for_you", "for_you_below_header", ""],
  ["for_you", "for_you_below_cart_blocks", ""],
  ["cart", "cart_above_lines", ""],
  ["about", "about_main", ""],
  ["offers", "offers_below_header", ""],
  ["recipe_index", "recipes_index_below_header", ""],
  ["recipe", "recipe_below_title", ""],
  ["recipe", "recipe_below_ingredients", ""],
  ["product_detail", "pdp_below_tabs", ""],
  ["product_detail", "pdp_below_context", ""],
];

/** Preload common editorial slots so first real request does not pay cold fetch. */
export async function warmHomePersonalizationCache(): Promise<void> {
  await Promise.all(
    SLOTS.map(([contentPage, contentRegion, categorySlug]) =>
      getHomePersonalizationProcessCached({
        contentPage,
        contentRegion,
        categorySlug: categorySlug || undefined,
      }).catch(() => null)
    )
  );
}
