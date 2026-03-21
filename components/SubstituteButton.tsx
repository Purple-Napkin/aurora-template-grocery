"use client";

import { useState, useRef, useEffect } from "react";
import { Replace } from "lucide-react";
import { useCart } from "@aurora-studio/starter-core";
import { useDietaryExclusions } from "./DietaryExclusionsContext";
import { holmesSimilarProducts, type SearchHit } from "@aurora-studio/starter-core";
import { formatPrice, toCents } from "@aurora-studio/starter-core";
import { ProductImage } from "@aurora-studio/starter-core";

interface SubstituteButtonProps {
  /** Cart item to substitute */
  item: {
    id: string;
    recordId: string;
    tableSlug: string;
    name: string;
    unitAmount: number;
    quantity: number;
    imageUrl?: string | null;
  };
  className?: string;
}

function getDisplayName(hit: SearchHit): string {
  return hit.name ?? hit.title ?? String(hit.recordId ?? hit.id ?? "");
}

function getPrice(hit: SearchHit): number | undefined {
  const p = hit.price ?? hit.unit_amount;
  if (p == null || typeof p !== "number") return undefined;
  const c = toCents(p);
  return c ?? Math.round(p * 100);
}

function getImageUrl(hit: SearchHit): string | null {
  const v = hit.image_url ?? hit.image;
  return typeof v === "string" ? v : null;
}

export function SubstituteButton({ item, className }: SubstituteButtonProps) {
  const { removeItem, addItem } = useCart();
  const { excludeDietary } = useDietaryExclusions();
  const [open, setOpen] = useState(false);
  const [alternatives, setAlternatives] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || alternatives.length > 0) return;
    setLoading(true);
    holmesSimilarProducts(item.recordId, 6, item.name, {
      excludeDietary: excludeDietary.length ? excludeDietary : undefined,
    })
      .then((res) => {
        const hits = (res.products ?? []) as SearchHit[];
        const filtered = hits.filter(
          (h) => (h.recordId ?? h.id) !== item.recordId
        );
        setAlternatives(filtered.slice(0, 4));
      })
      .catch(() => setAlternatives([]))
      .finally(() => setLoading(false));
  }, [open, item.recordId, alternatives.length, excludeDietary]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleSubstitute = (hit: SearchHit) => {
    const id = (hit.recordId ?? hit.id) as string;
    const name = getDisplayName(hit);
    const priceCents = getPrice(hit);
    const tableSlug = hit.tableSlug ?? item.tableSlug;
    if (!id || !priceCents) return;
    removeItem(item.id);
    addItem({
      recordId: id,
      tableSlug,
      name,
      unitAmount: priceCents,
      imageUrl: getImageUrl(hit),
      quantity: item.quantity,
    });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Substitute with similar"
        className={
          className ??
          "p-2 rounded-component border border-aurora-border hover:bg-aurora-surface-hover text-aurora-muted hover:text-aurora-text transition-colors"
        }
        aria-label="Substitute with similar product"
      >
        <Replace className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute z-50 right-0 top-full mt-2 w-64 rounded-component bg-aurora-surface border border-aurora-border shadow-lg overflow-hidden">
          <div className="p-2 border-b border-aurora-border">
            <p className="text-sm font-medium text-aurora-text">
              Substitute with similar
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-aurora-muted">
                Finding alternatives…
              </div>
            ) : alternatives.length === 0 ? (
              <div className="p-4 text-center text-sm text-aurora-muted">
                No substitutes found
              </div>
            ) : (
              alternatives.map((hit) => {
                const id = (hit.recordId ?? hit.id) as string;
                const name = getDisplayName(hit);
                const priceCents = getPrice(hit);
                const imageUrl = getImageUrl(hit);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSubstitute(hit)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-aurora-surface-hover text-left transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-aurora-surface-hover overflow-hidden shrink-0">
                      <ProductImage
                        src={imageUrl}
                        className="w-full h-full"
                        thumbnail
                        fallback={
                          <div className="w-full h-full flex items-center justify-center text-aurora-muted text-xs">
                            -
                          </div>
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      {priceCents != null && (
                        <p className="text-xs font-bold text-aurora-primary">
                          {formatPrice(priceCents)}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
