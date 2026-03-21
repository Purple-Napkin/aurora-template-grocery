"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AddToCartButton } from "@aurora-studio/starter-core";
import { ProductImage } from "@aurora-studio/starter-core";
import { useCart } from "@aurora-studio/starter-core";
import { useStore } from "@aurora-studio/starter-core";
import { useDietaryExclusions } from "./DietaryExclusionsContext";
import { formatPrice } from "@aurora-studio/starter-core";
import { holmesGoesWith, search, type SearchHit } from "@aurora-studio/starter-core";
import { toCents } from "@aurora-studio/starter-core";

function getImageUrl(hit: SearchHit): string | null {
  return hit.image_url ?? null;
}
function getPrice(hit: SearchHit): number | undefined {
  return hit.price != null ? toCents(hit.price) : undefined;
}
function getName(hit: SearchHit): string {
  return hit.name ?? hit.title ?? hit.snippet ?? hit.recordId ?? "";
}

/** "Customers usually buy" - suggests related products when basket has items. */
export function SmartBasketSuggest() {
  const { items } = useCart();
  const { store } = useStore();
  const { excludeDietary } = useDietaryExclusions();
  const [suggestions, setSuggestions] = useState<SearchHit[]>([]);

  const firstItemName = items[0]?.name?.split(/\s+/)[0] ?? "";

  useEffect(() => {
    if (items.length === 0) {
      setSuggestions([]);
      return;
    }
    const inCartIds = new Set(items.map((i) => i.recordId));
    const firstRecordId = items[0]?.recordId;
    holmesGoesWith(firstRecordId!, 6, {
      excludeDietary: excludeDietary.length ? excludeDietary : undefined,
    })
      .then((res) => {
        const hits = (res.products ?? []).filter(
          (h) => !inCartIds.has((h.recordId ?? h.id) as string)
        ) as SearchHit[];
        setSuggestions(hits.slice(0, 4));
      })
      .catch(() =>
        search({
          q: firstItemName || undefined,
          limit: 6,
          vendorId: store?.id,
          excludeDietary: excludeDietary.length ? excludeDietary : undefined,
        })
          .then((res) => {
            const hits = (res.hits ?? []).filter((h) => !inCartIds.has(h.recordId));
            setSuggestions(hits.slice(0, 4));
          })
          .catch(() => setSuggestions([]))
      );
  }, [items, firstItemName, store?.id, excludeDietary]);

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-aurora-border">
      <h2 className="font-semibold mb-4">Customers usually buy</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {suggestions.map((hit) => {
          const id = hit.recordId;
          const name = getName(hit);
          const priceCents = getPrice(hit);
          const imageUrl = getImageUrl(hit);
          const tableSlug = hit.tableSlug ?? "products";

          return (
            <div
              key={id}
              className="p-3 rounded-component bg-aurora-surface border border-aurora-border"
            >
              <Link href={`/catalogue/${id}`} className="block mb-2">
                <div className="aspect-square rounded-lg bg-aurora-surface-hover overflow-hidden mb-2">
                  <ProductImage
                    src={imageUrl}
                    className="w-full h-full"
                    objectFit="contain"
                    thumbnail
                    fallback={<div className="w-full h-full flex items-center justify-center text-aurora-muted">-</div>}
                  />
                </div>
                <p className="text-sm font-medium truncate">{name}</p>
                {priceCents != null && (
                  <p className="text-sm font-bold text-aurora-primary">{formatPrice(priceCents)}</p>
                )}
              </Link>
              {priceCents != null && (
                <AddToCartButton
                  recordId={id}
                  tableSlug={tableSlug}
                  name={name}
                  unitAmount={priceCents}
                  imageUrl={imageUrl}
                  className="w-full py-2 text-sm"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
