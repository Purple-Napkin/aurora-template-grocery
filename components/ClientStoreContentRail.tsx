"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getStoreConfig } from "@aurora-studio/starter-core";
import { useDietaryExclusions } from "@/components/DietaryExclusionsContext";
import {
  GroupedStoreContentSections,
  type StoreContentSection,
} from "@/components/storeContentBlocksUi";
import { getRecipeTitle } from "@/lib/cart-intelligence";

type Props = {
  contentPage: string;
  contentRegion: string;
  /** When set, sent as categorySlug (catalogue category filter). */
  categorySlug?: string | null;
  /** If true, use `?category=` from the URL when categorySlug is not passed. */
  useCatalogueCategoryFromUrl?: boolean;
  className?: string;
};

/**
 * Client-side CMS rail via `/api/holmes/home-personalization` (Holmes sid + dietary cookie analog).
 */
export function ClientStoreContentRail({
  contentPage,
  contentRegion,
  categorySlug = null,
  useCatalogueCategoryFromUrl = false,
  className,
}: Props) {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category")?.trim() ?? "";
  const urlSearchQ = searchParams.get("q")?.trim() ?? "";
  const { excludeDietary } = useDietaryExclusions();
  const [sections, setSections] = useState<StoreContentSection[]>([]);
  const [currency, setCurrency] = useState("GBP");

  const resolvedCategory =
    useCatalogueCategoryFromUrl && !categorySlug ? urlCategory : categorySlug?.trim() ?? "";

  useEffect(() => {
    let cancelled = false;
    getStoreConfig().then((c) => {
      if (cancelled) return;
      const curr = ((c as { currency?: string })?.currency ?? "gbp").toLowerCase();
      setCurrency(curr.length >= 3 ? curr.toUpperCase() : "GBP");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const dietaryKey = excludeDietary.join(",");

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      const sid =
        (typeof window !== "undefined" &&
          (window as { holmes?: { getSessionId?: () => string } }).holmes?.getSessionId?.()) ??
        "";
      const dietary =
        excludeDietary.length > 0
          ? `&excludeDietary=${encodeURIComponent(excludeDietary.join(","))}`
          : "";
      let url = `/api/holmes/home-personalization?sid=${encodeURIComponent(sid)}${dietary}&page=${encodeURIComponent(contentPage)}&region=${encodeURIComponent(contentRegion)}`;
      if (resolvedCategory) {
        url += `&categorySlug=${encodeURIComponent(resolvedCategory)}`;
      }
      if (contentPage === "catalogue" && urlSearchQ) {
        url += `&catalogueSearchQuery=${encodeURIComponent(urlSearchQ)}`;
      }
      fetch(url)
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          let next = Array.isArray(d?.sections) ? (d.sections as StoreContentSection[]) : [];
          const recipeTheme = getRecipeTitle(urlSearchQ);
          if (contentPage === "catalogue" && recipeTheme) {
            next = next.filter(
              (s) =>
                !(
                  s.type === "for_you" &&
                  "title" in s &&
                  typeof (s as { title?: string }).title === "string" &&
                  (s as { title: string }).title.startsWith("You searched")
                )
            );
          }
          setSections(next);
        })
        .catch(() => {
          if (!cancelled) setSections([]);
        });
    };
    load();
    document.addEventListener("holmes:ready", load);
    return () => {
      cancelled = true;
      document.removeEventListener("holmes:ready", load);
    };
  }, [contentPage, contentRegion, resolvedCategory, dietaryKey, urlSearchQ]);

  return (
    <GroupedStoreContentSections
      sections={sections}
      currency={currency}
      recipesWithProducts={[]}
      withHolmesMarkers={false}
      className={className}
    />
  );
}
