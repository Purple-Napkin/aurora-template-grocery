"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "aurora-starter-core";
import { useStore } from "aurora-starter-core";
import { useDietaryExclusions } from "./DietaryExclusionsContext";
import { holmesRecipeProducts, search, type SearchHit } from "aurora-starter-core";
import { formatPrice, toCents } from "aurora-starter-core";
import { getMealToComplete } from "@/lib/cart-intelligence";
import { AddToCartButton } from "aurora-starter-core";
import { ProductImage } from "aurora-starter-core";
import { getStoreConfig } from "aurora-starter-core";

/** When cart has meal triggers (curry paste, pasta sauce), show "Complete your X" with complementary products. */
export function CompleteYourMeal() {
  const { items, addItem } = useCart();
  const { store } = useStore();
  const { excludeDietary } = useDietaryExclusions();
  const [products, setProducts] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [catalogSlug, setCatalogSlug] = useState<string | null>(null);

  const mealData = getMealToComplete(items.map((i) => i.name));
  const inCartIds = new Set(items.map((i) => i.recordId));

  useEffect(() => {
    if (!mealData || !store?.id) return;
    setLoading(true);
    holmesRecipeProducts(mealData.meal, 6, {
      excludeDietary: excludeDietary.length ? excludeDietary : undefined,
    })
      .then((res) => {
        const hits = (res.products ?? []) as SearchHit[];
        const merged = hits
          .filter((h) => !inCartIds.has((h.recordId ?? h.id) as string))
          .slice(0, 6);
        setProducts(merged);
      })
      .catch(() => {
        const searchTerms = mealData!.searchTerms.slice(0, 3);
        return Promise.all(
          searchTerms.map((term) =>
            search({
              q: term,
              limit: 3,
              vendorId: store!.id,
              excludeDietary: excludeDietary.length ? excludeDietary : undefined,
            })
          )
        ).then((results) => {
          const seen = new Set<string>();
          const merged: SearchHit[] = [];
          for (const res of results) {
            for (const h of res.hits ?? []) {
              const id = (h.recordId ?? h.id) as string;
              if (!seen.has(id) && !inCartIds.has(id)) {
                seen.add(id);
                merged.push(h);
              }
            }
          }
          setProducts(merged.slice(0, 6));
        });
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [mealData, store?.id, items.length, excludeDietary]);

  useEffect(() => {
    getStoreConfig().then((c) => {
      const slug = (c as { catalogTableSlug?: string })?.catalogTableSlug;
      if (slug) setCatalogSlug(slug);
    });
  }, []);

  const handleAddAll = () => {
    if (!catalogSlug) return;
    for (const p of products) {
      const id = (p.recordId ?? p.id) as string;
      const name = p.name ?? p.title ?? String(p.recordId ?? p.id);
      const priceCents = toCents(p.price);
      if (priceCents != null)
        addItem({
          recordId: id,
          tableSlug: catalogSlug,
          name,
          unitAmount: priceCents,
          imageUrl: p.image_url,
        });
    }
  };

  if (!mealData || products.length === 0) return null;

  const mealLabel = mealData.meal.charAt(0).toUpperCase() + mealData.meal.slice(1);
  const totalCents = products.reduce(
    (s, p) => s + (toCents(p.price) ?? 0),
    0
  );

  return (
    <div className="pattern-well mb-6 p-4 rounded-xl border border-aurora-primary/30">
      <h3 className="font-semibold mb-2">Complete your {mealLabel}</h3>
      <p className="text-sm text-aurora-muted mb-3">
        Add rice, coconut milk & more for a full meal
      </p>
      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-20 h-20 rounded-lg bg-aurora-surface-hover animate-pulse shrink-0"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {products.map((p) => {
              const id = (p.recordId ?? p.id) as string;
              const name = p.name ?? p.title ?? String(p.recordId ?? p.id);
              const priceCents = toCents(p.price);
              return (
                <div
                  key={id}
                  className="shrink-0 w-24 flex flex-col items-center"
                >
                  <Link
                    href={`/catalogue/${id}`}
                    className="block w-16 h-16 rounded-lg bg-aurora-surface-hover overflow-hidden mb-1"
                  >
                    <ProductImage
                      src={p.image_url}
                      className="w-full h-full"
                      objectFit="contain"
                      thumbnail
                      fallback={<span className="w-full h-full flex items-center justify-center text-aurora-muted text-lg">-</span>}
                    />
                  </Link>
                  <p className="text-xs font-medium truncate w-full text-center">
                    {name}
                  </p>
                  {priceCents != null && catalogSlug && (
                    <AddToCartButton
                      recordId={id}
                      tableSlug={catalogSlug}
                      name={name}
                      unitAmount={priceCents}
                      imageUrl={p.image_url}
                      className="text-xs px-2 py-1 mt-0.5"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleAddAll}
            className="mt-3 px-4 py-2 rounded-lg bg-aurora-primary text-white text-sm font-semibold hover:bg-aurora-primary-dark transition-colors"
          >
            Add all – {formatPrice(totalCents)}
          </button>
        </>
      )}
    </div>
  );
}
