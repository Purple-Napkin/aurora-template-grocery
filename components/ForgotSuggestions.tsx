"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "aurora-starter-core";
import { useStore } from "aurora-starter-core";
import { useDietaryExclusions } from "./DietaryExclusionsContext";
import { search, holmesGoesWith, type SearchHit } from "aurora-starter-core";
import { formatPrice, toCents } from "aurora-starter-core";
import { getForgottenSuggestions } from "@/lib/cart-intelligence";
import { AddToCartButton } from "aurora-starter-core";
import { ProductImage } from "aurora-starter-core";
import { getStoreConfig } from "aurora-starter-core";

/** "You might have forgotten" - prefers Holmes goes-with, falls back to affinity search. */
export function ForgotSuggestions() {
  const { items } = useCart();
  const { store } = useStore();
  const { excludeDietary } = useDietaryExclusions();
  const [products, setProducts] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [catalogSlug, setCatalogSlug] = useState<string | null>(null);

  const suggestions = getForgottenSuggestions(items.map((i) => i.name));
  const inCartIds = new Set(items.map((i) => i.recordId));

  useEffect(() => {
    if ((!suggestions.length && items.length === 0) || !store?.id) return;
    setLoading(true);

    const firstRecordId = items[0]?.recordId;
    const holmesPromise = firstRecordId
      ? holmesGoesWith(firstRecordId, 8, {
          excludeDietary: excludeDietary.length ? excludeDietary : undefined,
        }).then((r) => r.products ?? []).catch(() => [])
      : Promise.resolve([]);

    const loadProducts = () => {
      const searchFallback = () =>
        Promise.all(
          suggestions.slice(0, 3).map((term) =>
            search({
              q: term,
              limit: 2,
              vendorId: store.id,
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
          return merged.slice(0, 4);
        });
      return holmesPromise.then((holmesProducts) => {
        const fromHolmes = (holmesProducts as SearchHit[]).filter(
          (h) => !inCartIds.has((h.recordId ?? h.id) as string)
        );
        if (fromHolmes.length >= 4) return fromHolmes.slice(0, 4);
        if (suggestions.length === 0) return fromHolmes.slice(0, 4);
        return searchFallback().then((searchHits) => {
          const seen = new Set(fromHolmes.map((h) => (h.recordId ?? h.id) as string));
          const merged = [...fromHolmes];
          for (const h of searchHits) {
            const id = (h.recordId ?? h.id) as string;
            if (!seen.has(id)) {
              seen.add(id);
              merged.push(h);
            }
          }
          return merged.slice(0, 4);
        });
      }).catch(() => (suggestions.length > 0 ? searchFallback().catch(() => []) : []));
    };
    loadProducts().then(setProducts).catch(() => setProducts([])).finally(() => setLoading(false));
  }, [suggestions.join(","), store?.id, items.length, items[0]?.recordId, excludeDietary]);

  useEffect(() => {
    getStoreConfig().then((c) => {
      const slug = (c as { catalogTableSlug?: string })?.catalogTableSlug;
      if (slug) setCatalogSlug(slug);
    });
  }, []);

  if (!suggestions.length || products.length === 0) return null;

  return (
    <div className="pattern-well mb-6 p-4 rounded-xl border border-aurora-border">
      <h3 className="font-semibold mb-2">Often added together</h3>
      {loading ? (
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-14 h-14 rounded-lg bg-aurora-surface-hover animate-pulse shrink-0"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((p) => {
            const id = (p.recordId ?? p.id) as string;
            const name = p.name ?? p.title ?? String(p.recordId ?? p.id);
            const priceCents = toCents(p.price);
            return (
              <div
                key={id}
                className="flex items-center gap-3 p-2 rounded-lg bg-white border border-aurora-border w-full"
              >
                <Link href={`/catalogue/${id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-aurora-surface overflow-hidden shrink-0">
                    <ProductImage
                      src={p.image_url}
                      className="w-full h-full"
                      objectFit="contain"
                      thumbnail
                      fallback={<span className="w-full h-full flex items-center justify-center text-aurora-muted text-sm">-</span>}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{name}</p>
                    {priceCents != null && (
                      <p className="text-xs text-aurora-primary font-semibold">{formatPrice(priceCents)}</p>
                    )}
                  </div>
                </Link>
                {priceCents != null && catalogSlug && (
                  <AddToCartButton
                    recordId={id}
                    tableSlug={catalogSlug}
                    name={name}
                    unitAmount={priceCents}
                    imageUrl={p.image_url}
                    className="text-xs px-2 py-1 shrink-0"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
