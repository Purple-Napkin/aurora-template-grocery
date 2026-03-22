import { getHomePersonalization, holmesRecentRecipes, holmesRecipeProducts } from "@aurora-studio/starter-core";
import { getStoreConfig } from "@aurora-studio/starter-core";
import { getTimeOfDay } from "@aurora-studio/starter-core";
import { getDietaryFromCookie } from "@/lib/dietary-server";
import { AdaptiveFeed } from "./AdaptiveFeed";
import {
  RecipeIdeasRail,
  GroupedStoreContentSections,
} from "./storeContentBlocksUi";

const CURRENCY_SYMBOLS: Record<string, string> = {
  gbp: "£",
  usd: "$",
  eur: "€",
  aud: "A$",
};

const HOME_PAGE = "home";
const HOME_REGION = "home_main_feed";

/** SSR fallback for home sections. AdaptiveFeed listens for holmes:homeSections and takes over when Holmes emits. */
export async function HomeSections() {
  const excludeDietary = await getDietaryFromCookie();
  const dietaryOpts = excludeDietary.length ? { excludeDietary } : undefined;

  const [homeData, config, recipesResult] = await Promise.all([
    getHomePersonalization(undefined, {
      ...dietaryOpts,
      contentPage: HOME_PAGE,
      contentRegion: HOME_REGION,
    }),
    getStoreConfig(),
    holmesRecentRecipes(8, getTimeOfDay(), dietaryOpts),
  ]);

  const currency =
    (config as { currency?: string })?.currency?.toLowerCase() ?? "gbp";
  const symbol = CURRENCY_SYMBOLS[currency] ?? "£";
  const recipes = recipesResult?.recipes ?? [];

  const recipesWithProducts = await Promise.all(
    recipes.slice(0, 4).map(async (r) => {
      try {
        const { products } = await holmesRecipeProducts(r.slug, 4, dietaryOpts);
        const imageUrls = (products ?? [])
          .map((p) => (p as { image_url?: string }).image_url)
          .filter((u): u is string => !!u);
        return { ...r, productImageUrls: imageUrls };
      } catch {
        return { ...r, productImageUrls: [] as string[] };
      }
    })
  );

  if (!homeData?.sections?.length) {
    return (
      <AdaptiveFeed recipes={recipesWithProducts} currency={currency}>
        <div className="min-h-[1px]" />
      </AdaptiveFeed>
    );
  }

  return (
    <AdaptiveFeed recipes={recipesWithProducts} currency={currency}>
      <RecipeIdeasRail recipesWithProducts={recipesWithProducts} />
      <GroupedStoreContentSections
        sections={homeData.sections}
        symbol={symbol}
        recipesWithProducts={recipesWithProducts}
        withHolmesMarkers
        pairGridClassName="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 last:mb-0"
      />
    </AdaptiveFeed>
  );
}
