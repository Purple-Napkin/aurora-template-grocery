"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  holmesRecipe,
  holmesRecipeProducts,
  isHolmesComboPending,
  holmesComboPollUntilReady,
} from "@aurora-studio/starter-core";
import { holmesRecipeView } from "@aurora-studio/starter-core";
import { HolmesTidbits } from "@aurora-studio/starter-core";
import { AddToCartButton } from "@aurora-studio/starter-core";
import { ProductImage } from "@aurora-studio/starter-core";
import { formatPrice, toCents } from "@aurora-studio/starter-core";
import { useCart } from "@aurora-studio/starter-core";
import { useDietaryExclusions } from "@/components/DietaryExclusionsContext";
import { getStoreConfig } from "@aurora-studio/starter-core";
import type { SearchHit } from "@aurora-studio/starter-core";
import {
  CONTENT_BLOCK_CARD_SHELL,
  CONTENT_BLOCK_IMAGE_WELL,
} from "@/components/ContentBlockProductCard";
import { RecipeHolmesExperience } from "@/components/RecipeHolmesExperience";

interface RecipePageViewProps {
  recipeSlug: string;
  recipeTitle: string;
  currency?: string;
  /** Use h2 for the recipe title when embedded under a page-level sr-only h1 (e.g. catalogue recipe search). */
  embeddedTitle?: boolean;
  /** Medium-confidence home rail: product grid + add-all only, no long-form recipe body. */
  compact?: boolean;
  /** Server returned 202 — recipe is being generated; client will poll until ready. */
  recipeAwaitingGeneration?: boolean;
}

export function RecipePageView({
  recipeSlug,
  recipeTitle,
  currency = "GBP",
  embeddedTitle = false,
  compact = false,
  recipeAwaitingGeneration = false,
}: RecipePageViewProps) {
  const { addItem } = useCart();
  const { excludeDietary } = useDietaryExclusions();
  const [recipe, setRecipe] = useState<{
    title: string;
    description: string | null;
    image_url: string | null;
    ingredients: Array<{ name: string; quantity?: string; unit?: string }>;
    instructions: string | null;
    origin_tidbit: string | null;
  } | null>(null);
  const [products, setProducts] = useState<SearchHit[]>([]);
  const [catalogSlug, setCatalogSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const TitleTag = embeddedTitle || compact ? "h2" : "h1";
  const titleClass = compact
    ? "font-display text-xl sm:text-2xl font-bold mb-1"
    : "font-display text-2xl sm:text-3xl font-bold mb-2";

  useEffect(() => {
    holmesRecipeView(recipeSlug, recipe?.title ?? recipeTitle);
  }, [recipeSlug, recipe?.title, recipeTitle]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [rec, prodRes, config] = await Promise.all([
          holmesRecipe(recipeSlug),
          holmesRecipeProducts(recipeSlug, compact ? 8 : 24, {
            excludeDietary: excludeDietary.length ? excludeDietary : undefined,
          }),
          getStoreConfig(),
        ]);
        if (cancelled) return;
        let resolved = rec;
        if (resolved && isHolmesComboPending(resolved)) {
          resolved = await holmesComboPollUntilReady(recipeSlug);
        }
        if (cancelled) return;
        if (resolved && !isHolmesComboPending(resolved)) {
          setRecipe({
            title: resolved.title,
            description: resolved.description,
            image_url: resolved.image_url?.trim() ? resolved.image_url.trim() : null,
            ingredients: resolved.ingredients ?? [],
            instructions: resolved.instructions,
            origin_tidbit: resolved.origin_tidbit,
          });
        } else {
          setRecipe(null);
        }
        setProducts((prodRes.products ?? []) as SearchHit[]);
        const slug = (config as { catalogTableSlug?: string })?.catalogTableSlug ?? null;
        setCatalogSlug(slug);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load recipe");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recipeSlug, excludeDietary, compact]);

  const addAllToCart = () => {
    if (!catalogSlug) return;
    const toAdd = compact ? products.slice(0, 8) : products;
    for (const hit of toAdd) {
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

  const displayProducts = compact ? products.slice(0, 8) : products;
  const totalCents = displayProducts.reduce(
    (s, p) => s + (toCents(p.price) ?? 0),
    0
  );

  const displayTitle = recipe?.title ?? recipeTitle;

  if (loading) {
    const msg =
      recipeAwaitingGeneration && !compact
        ? "Personalising this recipe…"
        : compact
          ? "Loading suggestions…"
          : "Finding your recipe…";
    return (
      <div
        className={`w-full flex flex-col items-center justify-center text-aurora-muted ${compact ? "py-8" : "py-16"}`}
      >
        <div className={`animate-pulse ${compact ? "text-base" : "text-lg"}`}>{msg}</div>
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
    <div className={`w-full ${compact ? "space-y-4" : "space-y-8"}`}>
      <header>
        {compact && (
          <p className="text-xs font-semibold text-aurora-muted uppercase tracking-widest mb-2">
            Finish this shop
          </p>
        )}
        <TitleTag className={titleClass}>{displayTitle}</TitleTag>
        {!compact && recipe?.origin_tidbit && (
          <p className="text-aurora-muted text-sm sm:text-base max-w-2xl italic">
            {recipe.origin_tidbit}
          </p>
        )}
        {!compact && recipe?.description && (
          <p className="mt-3 text-aurora-text text-base">{recipe.description}</p>
        )}
        {!compact && (
          <div className="mt-4">
            <HolmesTidbits entity={recipeSlug} entityType="recipe" />
          </div>
        )}
      </header>

      {!compact && recipe && (
        <RecipeHolmesExperience
          recipeTitle={displayTitle}
          recipeSlug={recipeSlug}
          ingredients={recipe.ingredients ?? []}
        />
      )}

      {!compact && recipe?.image_url && (
        <div
          className={`w-full max-w-3xl ${CONTENT_BLOCK_CARD_SHELL} overflow-hidden`}
        >
          <div className={`relative aspect-video ${CONTENT_BLOCK_IMAGE_WELL}`}>
            <ProductImage
              src={recipe.image_url}
              className="absolute inset-0 h-full w-full"
              objectFit="cover"
              thumbnail
              fallback={<div className="h-full w-full bg-white dark:bg-white" />}
            />
          </div>
        </div>
      )}

      {displayProducts.length > 0 && catalogSlug && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={addAllToCart}
            className={`rounded-lg bg-aurora-primary text-white font-semibold hover:bg-aurora-primary-dark transition-colors ${
              compact ? "px-3 py-2 text-sm" : "px-4 py-2 text-sm"
            }`}
          >
            {compact ? "Add missing items" : "Add all to cart"}
            {totalCents > 0 && ` – ${formatPrice(totalCents, currency)}`}
          </button>
        </div>
      )}

      {!compact && recipe?.ingredients && recipe.ingredients.length > 0 && (
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

      {!compact && recipe?.instructions && (
        <section>
          <h2 className="font-display text-lg font-semibold mb-3">Instructions</h2>
          <div className="text-aurora-text whitespace-pre-wrap">{recipe.instructions}</div>
        </section>
      )}

      {displayProducts.length > 0 && (
        <section>
          <h2 className={`font-display font-semibold mb-4 ${compact ? "text-base" : "text-lg"}`}>
            {compact ? "Popular picks to complete your basket" : "Products for this recipe"}
          </h2>
          <div
            className={
              compact
                ? "grid gap-3 sm:gap-4 w-full grid-cols-[repeat(auto-fill,minmax(140px,1fr))]"
                : "grid gap-4 sm:gap-5 w-full grid-cols-[repeat(auto-fill,minmax(160px,1fr))]"
            }
          >
            {displayProducts.map((hit) => {
              const id = (hit.recordId ?? hit.id) as string;
              const name = hit.name ?? hit.title ?? String(id);
              const priceCents = toCents(hit.price);
              const imageUrl = hit.image_url ?? null;
              return (
                <div
                  key={id}
                  className={`group flex flex-col overflow-hidden rounded-xl bg-white dark:bg-white min-w-[160px] min-h-[280px] ${CONTENT_BLOCK_CARD_SHELL}`}
                >
                  <Link href={`/catalogue/${id}`} className="block shrink-0">
                    <div className={CONTENT_BLOCK_IMAGE_WELL}>
                      <ProductImage
                        src={imageUrl}
                        className="absolute inset-0 h-full w-full"
                        objectFit="cover"
                        thumbnail
                        fallback={
                          <div className="w-full h-full flex items-center justify-center text-aurora-muted text-4xl">
                            -
                          </div>
                        }
                      />
                    </div>
                  </Link>
                  <div className="flex flex-col flex-1 px-3 sm:px-4 pt-3 pb-4 border-t border-stone-200/90">
                    <Link href={`/catalogue/${id}`} className="block min-w-0">
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
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
