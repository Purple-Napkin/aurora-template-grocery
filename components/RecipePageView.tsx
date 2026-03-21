"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { holmesRecipe, holmesRecipeProducts } from "@aurora-studio/starter-core";
import { holmesRecipeView } from "@aurora-studio/starter-core";
import { HolmesTidbits } from "@aurora-studio/starter-core";
import { AddToCartButton } from "@aurora-studio/starter-core";
import { ProductImage } from "@aurora-studio/starter-core";
import { formatPrice, toCents } from "@aurora-studio/starter-core";
import { useCart } from "@aurora-studio/starter-core";
import { useStore } from "@aurora-studio/starter-core";
import { useDietaryExclusions } from "@/components/DietaryExclusionsContext";
import { getStoreConfig } from "@aurora-studio/starter-core";
import type { SearchHit } from "@aurora-studio/starter-core";
import { getTimeOfDay } from "@aurora-studio/starter-core";

interface RecipePageViewProps {
  recipeSlug: string;
  recipeTitle: string;
  currency?: string;
}

export function RecipePageView({
  recipeSlug,
  recipeTitle,
  currency = "GBP",
}: RecipePageViewProps) {
  const { addItem } = useCart();
  const { store } = useStore();
  const { excludeDietary } = useDietaryExclusions();
  const [recipe, setRecipe] = useState<{
    title: string;
    description: string | null;
    ingredients: Array<{ name: string; quantity?: string; unit?: string }>;
    instructions: string | null;
    origin_tidbit: string | null;
  } | null>(null);
  const [products, setProducts] = useState<SearchHit[]>([]);
  const [catalogSlug, setCatalogSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    holmesRecipeView(recipeSlug, recipeTitle);
  }, [recipeSlug, recipeTitle]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      holmesRecipe(recipeSlug),
      holmesRecipeProducts(recipeSlug, 24, {
        excludeDietary: excludeDietary.length ? excludeDietary : undefined,
      }),
      getStoreConfig(),
    ])
      .then(([rec, prodRes, config]) => {
        if (cancelled) return;
        if (rec) {
          setRecipe({
            title: rec.title,
            description: rec.description,
            ingredients: rec.ingredients ?? [],
            instructions: rec.instructions,
            origin_tidbit: rec.origin_tidbit,
          });
        }
        setProducts((prodRes.products ?? []) as SearchHit[]);
        const slug = (config as { catalogTableSlug?: string })?.catalogTableSlug ?? null;
        setCatalogSlug(slug);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load recipe");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [recipeSlug, excludeDietary]);

  const addAllToCart = () => {
    if (!catalogSlug) return;
    for (const hit of products) {
      const id = (hit.recordId ?? hit.id) as string;
      const name = hit.name ?? hit.title ?? String(id);
      const rawPrice = hit.price;
      const priceCents = rawPrice != null ? toCents(rawPrice) : 0;
      if (priceCents != null && priceCents > 0) {
        addItem({
          recordId: id,
          tableSlug: catalogSlug,
          name,
          unitAmount: priceCents,
          imageUrl: hit.image_url,
        });
      }
    }
  };

  const totalCents = products.reduce(
    (s, p) => s + (toCents(p.price) ?? 0),
    0
  );

  if (loading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-aurora-muted">
        <div className="animate-pulse text-lg">Finding your recipe…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-aurora-muted">
        <p className="mb-4">{error}</p>
        <Link
          href="/catalogue"
          className="px-4 py-2 rounded-lg bg-aurora-primary text-white font-medium hover:bg-aurora-primary-dark"
        >
          Browse catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">
          {getTimeOfDay() === "evening"
            ? `Make tonight: ${recipe?.title ?? recipeTitle}`
            : `Make: ${recipe?.title ?? recipeTitle}`}
        </h1>
        {recipe?.origin_tidbit && (
          <p className="text-aurora-muted text-sm sm:text-base max-w-2xl italic">
            {recipe.origin_tidbit}
          </p>
        )}
        {recipe?.description && (
          <p className="mt-3 text-aurora-text text-base">{recipe.description}</p>
        )}
        <div className="mt-4">
          <HolmesTidbits entity={recipeSlug} entityType="recipe" />
        </div>
      </header>

      {products.length > 0 && catalogSlug && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={addAllToCart}
            className="px-4 py-2 rounded-lg bg-aurora-primary text-white text-sm font-semibold hover:bg-aurora-primary-dark transition-colors"
          >
            Add all to cart
            {totalCents > 0 && ` – ${formatPrice(totalCents, currency)}`}
          </button>
        </div>
      )}

      {recipe?.ingredients && recipe.ingredients.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold mb-3">Ingredients</h2>
          <ul className="list-disc list-inside text-aurora-text space-y-1">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>
                {ing.quantity && `${ing.quantity} `}
                {ing.unit && `${ing.unit} `}
                {ing.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {recipe?.instructions && (
        <section>
          <h2 className="font-display text-lg font-semibold mb-3">Instructions</h2>
          <div className="text-aurora-text whitespace-pre-wrap">{recipe.instructions}</div>
        </section>
      )}

      {products.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold mb-4">Products for this recipe</h2>
          <div
            className={`grid gap-4 sm:gap-5 w-full grid-cols-[repeat(auto-fill,minmax(160px,1fr))]`}
          >
            {products.map((hit) => {
              const id = (hit.recordId ?? hit.id) as string;
              const name = hit.name ?? hit.title ?? String(id);
              const priceCents = toCents(hit.price);
              const imageUrl = hit.image_url ?? null;
              return (
                <div
                  key={id}
                  className="p-4 rounded-xl bg-aurora-surface border border-aurora-border hover:border-aurora-primary/40 hover:shadow-[0_10px_25px_rgba(0,0,0,0.08)] transition-all overflow-hidden min-w-[160px] min-h-[280px] flex flex-col"
                >
                  <Link href={`/catalogue/${id}`} className="block">
                    <div className="aspect-square rounded-lg bg-aurora-surface-hover mb-3 overflow-hidden">
                      <ProductImage
                        src={imageUrl}
                        className="w-full h-full"
                        objectFit="contain"
                        thumbnail
                        fallback={
                          <div className="w-full h-full flex items-center justify-center text-aurora-muted text-4xl">
                            -
                          </div>
                        }
                      />
                    </div>
                    <p className="font-semibold text-sm sm:text-base truncate group-hover:text-aurora-primary transition-colors">
                      {name}
                    </p>
                    {priceCents != null && (
                      <p className="text-sm mt-1 font-bold text-aurora-primary">
                        {formatPrice(priceCents, currency)}
                      </p>
                    )}
                  </Link>
                  {priceCents != null && catalogSlug && (
                    <div className="mt-auto pt-3">
                      <AddToCartButton
                        recordId={id}
                        tableSlug={catalogSlug}
                        name={name}
                        unitAmount={priceCents}
                        imageUrl={imageUrl}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
