"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@aurora-studio/starter-core";
import { useMissionAware } from "@/components/MissionAwareHome";
import { holmesCombosForCart, holmesSelectCombo } from "@aurora-studio/starter-core";
import { RecipeProductCollage } from "./RecipeProductCollage";

/**
 * Recipe picker – when cart has 2+ items and Holmes has recipe options, show picker.
 * User selects a recipe; we persist it and refresh mission/personalization.
 */
export function RecipePicker() {
  const { items } = useCart();
  const missionData = useMissionAware();
  const [combos, setCombos] = useState<Array<{ slug: string; title: string; productImageUrls?: string[] }>>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (items.length < 2 || dismissed) {
      setCombos([]);
      return;
    }
    let cancelled = false;
    holmesCombosForCart({
      cartIds: items.map((i) => i.recordId).filter(Boolean),
      cartNames: items.map((i) => i.name).filter(Boolean),
      limit: 3,
      sid:
        typeof window !== "undefined"
          ? (window as { holmes?: { getSessionId?: () => string } }).holmes?.getSessionId?.()
          : undefined,
    })
      .then((res) => {
        if (!cancelled && res.combos?.length) setCombos(res.combos);
        else if (!cancelled) setCombos([]);
      })
      .catch(() => {
        if (!cancelled) setCombos([]);
      });
    return () => { cancelled = true; };
  }, [items.length, items.map((i) => i.recordId).join(","), dismissed]);

  const handleSelect = async (combo: { slug: string; title: string }) => {
    const sid =
      typeof window !== "undefined"
        ? (window as { holmes?: { getSessionId?: () => string } }).holmes?.getSessionId?.()
        : null;
    if (!sid) return;
    try {
      await holmesSelectCombo({ sid, slug: combo.slug, title: combo.title });
      setDismissed(true);
      missionData?.refresh?.();
      window.dispatchEvent(new CustomEvent("holmes:comboSelected", { detail: combo }));
    } catch {
      // ignore
    }
  };

  if (items.length < 2 || dismissed || combos.length === 0) return null;

  return (
    <div
      id="recipe-picker"
      className="pattern-well mb-6 p-4 rounded-xl border border-aurora-primary/30 bg-aurora-primary/5 scroll-mt-24"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Pick your bundle</h3>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-aurora-muted hover:text-aurora-text text-sm"
        >
          Dismiss
        </button>
      </div>
      <p className="text-sm text-aurora-muted mb-4">
        Holmes found suggestions for your cart. Choose one to complete your order.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {combos.map((combo) => (
          <div
            key={combo.slug}
            className="p-4 rounded-xl bg-aurora-surface border border-aurora-border hover:border-aurora-primary/40 transition-all flex flex-col"
          >
            <div className="aspect-square rounded-lg mb-3 overflow-hidden bg-aurora-surface-hover">
              <RecipeProductCollage
                imageUrls={combo.productImageUrls ?? []}
                className="w-full h-full"
              />
            </div>
            <h4 className="font-semibold text-sm truncate mb-2">{combo.title}</h4>
            <div className="mt-auto flex gap-2">
              <button
                type="button"
                onClick={() => handleSelect(combo)}
                className="flex-1 px-3 py-2 rounded-lg bg-aurora-primary text-white text-sm font-medium hover:bg-aurora-primary-dark transition-colors"
              >
                Select
              </button>
              <Link
                href={`/recipes/${encodeURIComponent(combo.slug)}`}
                className="px-3 py-2 rounded-lg border border-aurora-border hover:bg-aurora-surface-hover text-sm"
              >
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
