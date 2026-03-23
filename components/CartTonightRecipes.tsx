"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChefHat } from "lucide-react";
import { useCart } from "@aurora-studio/starter-core";
import {
  getTimeOfDay,
  holmesRecentRecipes,
  holmesRecipeProducts,
} from "@aurora-studio/starter-core";
import { useDietaryExclusions } from "@/components/DietaryExclusionsContext";
import { getMealToComplete } from "@/lib/cart-intelligence";
import { RecipeProductCollage } from "@/components/RecipeProductCollage";
import {
  CONTENT_BLOCK_CARD_SHELL,
  CONTENT_BLOCK_CARD_FOOTER_BAND,
  CONTENT_BLOCK_IMAGE_WELL,
} from "@/components/ContentBlockProductCard";

type RecipeRow = { slug: string; title: string; productImageUrls: string[] };

function rankByCart(
  recipes: Array<{ slug: string; title: string; description: string | null }>,
  cartNames: string[],
  meal: string | null
): typeof recipes {
  const cartWords = new Set(
    cartNames.flatMap((n) => n.toLowerCase().split(/\s+/)).filter((w) => w.length >= 2)
  );
  const mealLower = meal?.toLowerCase() ?? "";
  const score = (r: { slug: string; title: string; description: string | null }) => {
    let s = 0;
    const slugLower = r.slug.toLowerCase();
    const titleLower = (r.title ?? "").toLowerCase();
    const descLower = (r.description ?? "").toLowerCase();
    const combined = `${slugLower} ${titleLower} ${descLower}`;
    if (
      mealLower &&
      (slugLower === mealLower || slugLower.includes(mealLower) || titleLower.includes(mealLower))
    ) {
      s += 100;
    }
    for (const w of cartWords) {
      if (combined.includes(w)) s += 10;
    }
    return s;
  };
  return [...recipes].sort((a, b) => score(b) - score(a));
}

/**
 * Replaces API “Meals for tonight” **product** rails on the cart with recipe cards matched to the basket.
 */
export function CartTonightRecipes() {
  const { items } = useCart();
  const { excludeDietary } = useDietaryExclusions();
  const [rows, setRows] = useState<RecipeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const cartNames = items.map((i) => i.name).filter(Boolean);
    const dietaryOpts = excludeDietary.length ? { excludeDietary } : undefined;
    const meal = getMealToComplete(cartNames)?.meal ?? null;

    holmesRecentRecipes(24, getTimeOfDay(), dietaryOpts)
      .then(({ recipes }) => {
        if (cancelled || !recipes?.length) return rankByCart([], cartNames, meal);
        return rankByCart(recipes, cartNames, meal).slice(0, 4);
      })
      .then(async (top) => {
        if (cancelled) return;
        const out: RecipeRow[] = [];
        for (const r of top) {
          try {
            const { products } = await holmesRecipeProducts(r.slug, 4, dietaryOpts);
            const urls = (products ?? [])
              .map((p) => (p as { image_url?: string }).image_url)
              .filter((u): u is string => !!u);
            out.push({ slug: r.slug, title: r.title, productImageUrls: urls });
          } catch {
            out.push({ slug: r.slug, title: r.title, productImageUrls: [] });
          }
        }
        if (!cancelled) setRows(out);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [items.map((i) => `${i.recordId}:${i.name}`).join(","), excludeDietary]);

  if (items.length === 0) return null;

  return (
    <section className="mb-8" aria-labelledby="cart-tonight-recipes-heading">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h2
          id="cart-tonight-recipes-heading"
          className="font-display text-lg sm:text-xl font-bold text-aurora-text flex items-center gap-2"
        >
          <ChefHat className="w-5 h-5 text-aurora-primary shrink-0" aria-hidden />
          Meals for tonight
        </h2>
        <Link
          href="/for-you/recipes"
          className="text-sm font-semibold text-aurora-primary hover:underline shrink-0"
        >
          See all
        </Link>
      </div>
      <p className="text-sm text-aurora-muted mb-4 max-w-2xl">
        Recipe ideas matched to what&apos;s in your basket — not a generic product list.
      </p>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-48 rounded-xl animate-pulse bg-aurora-surface-hover ${CONTENT_BLOCK_CARD_SHELL}`}
            />
          ))}
        </div>
      ) : rows.length === 0 ? null : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {rows.map((r) => (
            <Link
              key={r.slug}
              href={`/recipes/${encodeURIComponent(r.slug)}`}
              className={`flex flex-col overflow-hidden rounded-xl bg-white dark:bg-white ${CONTENT_BLOCK_CARD_SHELL}`}
            >
              <div className={CONTENT_BLOCK_IMAGE_WELL}>
                <RecipeProductCollage
                  imageUrls={r.productImageUrls}
                  className="absolute inset-0 h-full w-full"
                />
              </div>
              <div className={CONTENT_BLOCK_CARD_FOOTER_BAND}>
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900">
                  {r.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
