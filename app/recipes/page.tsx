import Link from "next/link";
import { holmesRecentRecipes, holmesRecipeProducts } from "aurora-starter-core";
import { getTimeOfDay } from "aurora-starter-core";
import { getDietaryFromCookie } from "@/lib/dietary-server";
import { RecipeProductCollage } from "@/components/RecipeProductCollage";
import { Sparkles, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Interstitial page: recipes recently searched for by others.
 * Linked from the "Recipe ideas" quick start on the hero.
 */
export default async function RecipesInterstitialPage() {
  const excludeDietary = await getDietaryFromCookie();
  const dietaryOpts = excludeDietary.length ? { excludeDietary } : undefined;

  const { recipes } = await holmesRecentRecipes(24, getTimeOfDay(), dietaryOpts);

  const recipesWithProducts = await Promise.all(
    recipes.map(async (r) => {
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

  return (
    <div className="min-h-screen bg-aurora-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-aurora-muted hover:text-aurora-text text-sm font-medium mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-aurora-primary/15">
            <Sparkles className="w-6 h-6 text-aurora-primary" aria-hidden />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-aurora-text">
              Recipe ideas
            </h1>
            <p className="text-aurora-muted text-sm sm:text-base mt-0.5">
              Recipes others are searching for right now
            </p>
          </div>
        </div>

        {recipesWithProducts.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-aurora-surface border border-aurora-border">
            <p className="text-aurora-muted">No recipes available yet.</p>
            <Link
              href="/catalogue?q=recipe"
              className="mt-4 inline-block text-aurora-primary font-semibold hover:underline"
            >
              Browse products instead →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recipesWithProducts.map((r) => (
              <Link
                key={r.id}
                href={`/recipes/${encodeURIComponent(r.slug)}`}
                className="group block p-4 rounded-xl bg-aurora-surface border border-aurora-border hover:border-aurora-primary/40 hover:shadow-md transition-all"
              >
                <div className="aspect-square rounded-lg mb-3 overflow-hidden bg-aurora-surface-hover">
                  <RecipeProductCollage
                    imageUrls={r.productImageUrls ?? []}
                    className="w-full h-full"
                  />
                </div>
                <h2 className="font-semibold text-sm truncate group-hover:text-aurora-primary transition-colors">
                  {r.title}
                </h2>
                {r.description && (
                  <p className="text-xs text-aurora-muted line-clamp-2 mt-0.5">
                    {r.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
