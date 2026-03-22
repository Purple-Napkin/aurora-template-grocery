import { getHomePersonalization, holmesRecentRecipes, holmesRecipeProducts } from "@aurora-studio/starter-core";
import { getStoreConfig } from "@aurora-studio/starter-core";
import { getTimeOfDay } from "@aurora-studio/starter-core";
import { getDietaryFromCookie } from "@/lib/dietary-server";
import { RecipeIdeasRail, GroupedStoreContentSections } from "./storeContentBlocksUi";

const FOR_YOU_PAGE = "for_you";
const FOR_YOU_REGION = "for_you_below_cart_blocks";

/** Sections for For You page – same CMS blocks as home, different page/region; no Holmes home-section markers. */
export async function ForYouSections() {
  const excludeDietary = await getDietaryFromCookie();
  const dietaryOpts = excludeDietary.length ? { excludeDietary } : undefined;

  const [homeData, config, recipesResult] = await Promise.all([
    getHomePersonalization(undefined, {
      ...dietaryOpts,
      contentPage: FOR_YOU_PAGE,
      contentRegion: FOR_YOU_REGION,
    }),
    getStoreConfig(),
    holmesRecentRecipes(8, getTimeOfDay(), dietaryOpts),
  ]);

  const currency =
    (config as { currency?: string })?.currency?.toLowerCase() ?? "gbp";
  const currencyCode = currency.length >= 3 ? currency.toUpperCase() : "GBP";
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

  const sections = homeData?.sections ?? [];
  const hasRecipes = recipesWithProducts.length > 0;

  if (sections.length === 0 && !hasRecipes) {
    return (
      <section className="space-y-6">
        <h2 className="text-xl font-bold">Recipe ideas</h2>
        <p className="text-aurora-muted text-sm">
          Add items to your basket to see personalized suggestions.
        </p>
      </section>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="space-y-10">
        <RecipeIdeasRail recipesWithProducts={recipesWithProducts} withHolmesMarkers={false} />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <RecipeIdeasRail recipesWithProducts={recipesWithProducts} withHolmesMarkers={false} />
      <GroupedStoreContentSections
        sections={sections}
        currency={currencyCode}
        recipesWithProducts={recipesWithProducts}
        withHolmesMarkers={false}
        pairGridClassName="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 last:mb-0"
      />
    </div>
  );
}
