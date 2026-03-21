import Link from "next/link";
import { getHomePersonalization, holmesRecentRecipes, holmesRecipeProducts } from "@aurora-studio/starter-core";
import { getStoreConfig } from "@aurora-studio/starter-core";
import { getTimeOfDay } from "@aurora-studio/starter-core";
import { getDietaryFromCookie } from "@/lib/dietary-server";
import { ProductImage } from "@aurora-studio/starter-core";
import { ChefHat } from "lucide-react";
import { RecipeProductCollage } from "./RecipeProductCollage";

const CURRENCY_SYMBOLS: Record<string, string> = {
  gbp: "£",
  usd: "$",
  eur: "€",
  aud: "A$",
};

/** Sections for For You page – recipes, products, inspiration. Reuses home personalization. */
export async function ForYouSections() {
  const excludeDietary = await getDietaryFromCookie();
  const dietaryOpts = excludeDietary.length ? { excludeDietary } : undefined;

  const [homeData, config, recipesResult] = await Promise.all([
    getHomePersonalization(undefined, dietaryOpts),
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

  const sections = homeData?.sections ?? [];
  const hasRecipes = recipesWithProducts.length > 0;

  if (sections.length === 0 && !hasRecipes) {
    return (
      <section className="space-y-6">
        <h2 className="text-xl font-bold">Recipe ideas</h2>
        {hasRecipes ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recipesWithProducts.map((r) => (
              <Link
                key={r.id}
                href={`/recipes/${encodeURIComponent(r.slug)}`}
                className="block p-4 rounded-xl bg-aurora-surface border border-aurora-border hover:border-aurora-primary/40 hover:shadow-md transition-all"
              >
                <div className="aspect-square rounded-lg mb-2 overflow-hidden">
                  <RecipeProductCollage
                    imageUrls={r.productImageUrls ?? []}
                    className="w-full h-full"
                  />
                </div>
                <div className="font-semibold text-sm truncate">{r.title}</div>
                {r.description && (
                  <p className="text-xs text-aurora-muted line-clamp-2 mt-0.5">
                    {r.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-aurora-muted text-sm">
            Add items to your basket to see personalized suggestions.
          </p>
        )}
      </section>
    );
  }

  return (
    <div className="space-y-10">
      {sections.map((sec, i) => {
        if (sec.type === "meals" && hasRecipes) {
          return (
            <section key={i} className="mb-10 last:mb-0">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-aurora-primary" />
                {sec.title || "Recipe ideas"}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {recipesWithProducts.map((r) => (
                  <Link
                    key={r.id}
                    href={`/recipes/${encodeURIComponent(r.slug)}`}
                    className="block p-4 rounded-xl bg-aurora-surface border border-aurora-border hover:border-aurora-primary/40 hover:shadow-md transition-all"
                  >
                    <div className="aspect-square rounded-lg mb-2 overflow-hidden">
                      <RecipeProductCollage
                        imageUrls={r.productImageUrls ?? []}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="font-semibold text-sm truncate">{r.title}</div>
                    {r.description && (
                      <p className="text-xs text-aurora-muted line-clamp-2 mt-0.5">
                        {r.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          );
        }

        if (sec.type === "inspiration") {
          return (
            <section key={i} className="mb-10 last:mb-0">
              <h2 className="text-xl font-bold mb-4">{sec.title}</h2>
              {sec.subtitle && (
                <p className="text-aurora-muted text-sm mb-4">{sec.subtitle}</p>
              )}
              {sec.cards && sec.cards.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {sec.cards.map((card, j) => (
                    <Link
                      key={j}
                      href={card.linkUrl || "/catalogue"}
                      className="block p-4 rounded-xl bg-aurora-surface border border-aurora-border hover:border-aurora-primary/40 hover:shadow-md transition-all"
                    >
                      <div className="aspect-square rounded-lg bg-aurora-surface-hover mb-2 overflow-hidden">
                        <ProductImage
                          src={card.imageUrl}
                          className="w-full h-full"
                          thumbnail
                          fallback={
                            <span className="w-full h-full flex items-center justify-center text-aurora-muted text-sm text-center px-2">
                              {card.title}
                            </span>
                          }
                        />
                      </div>
                      <div className="font-semibold text-sm truncate">
                        {card.title}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          );
        }

        return (
          <section key={i} className="mb-10 last:mb-0">
            <h2 className="text-xl font-bold mb-4">{sec.title}</h2>
            {sec.products && sec.products.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {sec.products.map((prod) => (
                  <Link
                    key={prod.id}
                    href={`/catalogue/${prod.id}`}
                    className="block p-4 rounded-xl bg-aurora-surface border border-aurora-border hover:border-aurora-primary/40 hover:shadow-md transition-all"
                  >
                    <div className="aspect-square rounded-lg bg-aurora-surface-hover mb-2 overflow-hidden">
                      <ProductImage
                        src={prod.image_url}
                        baseUrl={process.env.NEXT_PUBLIC_APP_URL}
                        className="w-full h-full"
                        thumbnail
                        fallback={
                          <span className="w-full h-full flex items-center justify-center text-aurora-muted text-2xl">
                            -
                          </span>
                        }
                      />
                    </div>
                    <div className="font-semibold text-sm truncate">
                      {prod.name}
                    </div>
                    {prod.price != null && Number(prod.price) > 0 && (
                      <div className="text-sm font-bold text-aurora-primary mt-0.5">
                        {symbol}
                        {Number(prod.price).toFixed(2)}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
