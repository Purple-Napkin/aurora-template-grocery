"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AddToCartButton } from "@aurora-studio/starter-core";
import { useStore } from "@aurora-studio/starter-core";
import { useDietaryExclusions } from "@/components/DietaryExclusionsContext";
import { useCart } from "@aurora-studio/starter-core";
import { useMissionAware } from "@/components/MissionAwareHome";
import { formatPrice, toCents } from "@aurora-studio/starter-core";
import { search, getStoreConfig } from "@aurora-studio/starter-core";
import { getRecipeTitle, expandRecipeSearchQuery } from "@/lib/cart-intelligence";
import { holmesSearch } from "@aurora-studio/starter-core";
import { getTimeOfDay } from "@aurora-studio/starter-core";
import { isMissionBarDismissed } from "@/lib/mission-bar";
import { MISSION_CATEGORY_PRIORITY, MISSION_FOCUS_QUERY } from "@/lib/mission-catalogue-config";
import type { SearchHit } from "@aurora-studio/starter-core";
import {
  CatalogueFilters,
  type CategoryItem,
  type SortOption,
} from "@aurora-studio/starter-core";
import { ProductImage } from "@aurora-studio/starter-core";
import { SortDropdown } from "@aurora-studio/starter-core";
import { ProductCardSkeleton } from "@aurora-studio/starter-core";
import { CatalogueEmptyState } from "@aurora-studio/starter-core";
import { RecipePageView } from "@/components/RecipePageView";

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { name: "Bakery Items", slug: "bakery-items" },
  { name: "Frozen Foods", slug: "frozen-foods" },
  { name: "Vegetables", slug: "vegetables" },
  { name: "Fruits", slug: "fruits" },
  { name: "Dairy Products", slug: "dairy-products" },
  { name: "Snacks", slug: "snacks" },
  { name: "Beverages", slug: "beverages" },
];

function getImageUrl(record: Record<string, unknown>): string | null {
  const url = (record as SearchHit).image_url ?? record.image_url ?? record.image ?? record.thumbnail ?? record.photo;
  return url ? String(url) : null;
}

/** Aurora/Meilisearch return price as decimal (e.g. 2.00 = £2). Use toCents for display/cart. */
function getPrice(record: Record<string, unknown>): number | undefined {
  const p = (record as SearchHit).price ?? record.price ?? record.amount ?? record.value;
  return p != null ? Number(p) : undefined;
}

function getDisplayName(record: Record<string, unknown>): string {
  const r = record as SearchHit;
  return String(r.name ?? r.title ?? r.snippet ?? record.id ?? "");
}

function getBrand(record: Record<string, unknown>): string | null {
  const brand = record.brand ?? record.brand_name ?? record.vendor_name;
  return brand ? String(brand) : null;
}

function getRating(record: Record<string, unknown>): number | null {
  const r = record.rating ?? record.average_rating ?? record.review_rating;
  return r != null ? Number(r) : null;
}

function CatalogueContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get("category") ?? "";
  const q = searchParams.get("q") ?? "";
  const { store } = useStore();
  const { excludeDietary } = useDietaryExclusions();
  const { addItem } = useCart();
  const missionData = useMissionAware();
  const [missionBarDismissed, setMissionBarDismissed] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<SortOption>("featured");
  const [catalogSlug, setCatalogSlug] = useState<string | null>(null);
  const [currency, setCurrency] = useState("GBP");
  const [page, setPage] = useState(0);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [suggestedSlugs, setSuggestedSlugs] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [missionFocusHits, setMissionFocusHits] = useState<SearchHit[]>([]);
  const hasAppliedSuggestionRef = useRef(false);
  const limit = 24;

  const activeMission = missionData?.activeMission;
  const narrowCatalog =
    activeMission?.uiHints?.narrowCatalog && !missionBarDismissed;
  const missionPrioritySlugs = narrowCatalog && activeMission
    ? (MISSION_CATEGORY_PRIORITY[activeMission.key] ?? [])
    : [];
  const focusQuery = narrowCatalog && activeMission
    ? (MISSION_FOCUS_QUERY[activeMission.key] ?? "")
    : "";

  const categoriesWithProducts = categories.filter(
    (cat) => categoryCounts[cat.slug] === undefined || categoryCounts[cat.slug] > 0
  );

  useEffect(() => {
    let cancelled = false;
    const url = store?.id
      ? `/api/categories?vendorId=${encodeURIComponent(store.id)}`
      : "/api/categories";
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.categories?.length) {
          setCategories(d.categories);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [store?.id]);

  const prevCategoryRef = useRef(category);
  if (prevCategoryRef.current !== category) {
    prevCategoryRef.current = category;
    setPage(0);
  }

  const loadProducts = useCallback(async () => {
    if (getRecipeTitle(q)) {
      setHits([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const sort = tab === "new" ? "created_at" : tab === "sale" ? "price" : "name";
      const order = tab === "new" ? "desc" : "asc";
      const searchQ = q.trim() ? expandRecipeSearchQuery(q.trim()) : undefined;
      const res = await search({
        q: searchQ || undefined,
        limit,
        offset: page * limit,
        vendorId: store?.id,
        category: category || undefined,
        sort,
        order,
        excludeDietary: excludeDietary.length ? excludeDietary : undefined,
      });
      setHits(res.hits ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setHits([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [store?.id, category, q, tab, page, excludeDietary]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const config = await getStoreConfig();
        if (config?.enabled && config.catalogTableSlug) {
          if (!cancelled) {
            setCatalogSlug(config.catalogTableSlug);
            setCurrency((config as { currency?: string }).currency ?? "GBP");
          }
        }
      } catch {
        if (!cancelled) setCatalogSlug("products");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    setMissionBarDismissed(isMissionBarDismissed());
  }, []);
  useEffect(() => {
    const onDismissed = () => setMissionBarDismissed(true);
    const onReset = () => setMissionBarDismissed(false);
    window.addEventListener("holmes:missionBarDismissed", onDismissed);
    window.addEventListener("holmes:missionBarReset", onReset);
    return () => {
      window.removeEventListener("holmes:missionBarDismissed", onDismissed);
      window.removeEventListener("holmes:missionBarReset", onReset);
    };
  }, []);

  useEffect(() => {
    if (!focusQuery || !store?.id) {
      setMissionFocusHits([]);
      return;
    }
    let cancelled = false;
    search({
      q: focusQuery,
      limit: 8,
      offset: 0,
      vendorId: store.id,
      category: category || undefined,
      excludeDietary: excludeDietary.length ? excludeDietary : undefined,
    })
      .then((res) => {
        if (!cancelled) setMissionFocusHits(res.hits ?? []);
      })
      .catch(() => {
        if (!cancelled) setMissionFocusHits([]);
      });
    return () => { cancelled = true; };
  }, [focusQuery, store?.id, category, excludeDietary]);

  useEffect(() => {
    let cancelled = false;
    if (!categories.length || !store?.id) return;
    (async () => {
      const counts: Record<string, number> = {};
      await Promise.all(
        categories.map(async (cat) => {
          try {
            const res = await search({
              q: "",
              limit: 1,
              offset: 0,
              vendorId: store?.id,
              category: cat.slug,
              excludeDietary: excludeDietary.length ? excludeDietary : undefined,
            });
            if (!cancelled) counts[cat.slug] = res.total ?? 0;
          } catch {
            if (!cancelled) counts[cat.slug] = 0;
          }
        })
      );
      if (!cancelled) setCategoryCounts((prev) => ({ ...prev, ...counts }));
    })();
    return () => {
      cancelled = true;
    };
  }, [categories, store?.id, excludeDietary]);

  useEffect(() => {
    let cancelled = false;
    const fetchSuggested = () => {
      const sid = typeof window !== "undefined" && (window as { holmes?: { getSessionId?: () => string } }).holmes?.getSessionId?.();
      if (!sid || cancelled) return;
      fetch(`/api/category-suggestions?sid=${encodeURIComponent(sid)}`)
        .then((r) => (r.ok ? r.json() : { suggested: [] }))
        .then((data) => {
          if (!cancelled && Array.isArray(data?.suggested)) setSuggestedSlugs(data.suggested);
        })
        .catch(() => {});
    };
    fetchSuggested();
    const onReady = () => { fetchSuggested(); };
    document.addEventListener("holmes:ready", onReady);
    const onCartUpdate = () => { fetchSuggested(); };
    document.addEventListener("holmes:cartUpdate", onCartUpdate);
    const pollInterval = setInterval(() => {
      const sid = (window as { holmes?: { getSessionId?: () => string } }).holmes?.getSessionId?.();
      if (sid) {
        fetchSuggested();
        clearInterval(pollInterval);
      }
    }, 400);
    const timeout = setTimeout(() => clearInterval(pollInterval), 6000);
    const refreshInterval = setInterval(fetchSuggested, 8000);
    return () => {
      cancelled = true;
      document.removeEventListener("holmes:ready", onReady);
      document.removeEventListener("holmes:cartUpdate", onCartUpdate);
      clearInterval(pollInterval);
      clearInterval(refreshInterval);
      clearTimeout(timeout);
    };
  }, []);

  // When Holmes suggests categories and we're on catalogue with no filter, navigate to first suggested
  // so snacks/beer etc. persist instead of reverting to "All categories"
  useEffect(() => {
    if (
      hasAppliedSuggestionRef.current ||
      category !== "" ||
      suggestedSlugs.length === 0 ||
      categoriesWithProducts.length === 0
    )
      return;
    const first = suggestedSlugs[0];
    if (!first) return;
    const exists = categoriesWithProducts.some((c) => c.slug === first || c.slug === first.toLowerCase().replace(/\s+/g, "-"));
    if (exists) {
      hasAppliedSuggestionRef.current = true;
      const slug = categoriesWithProducts.find((c) => c.slug === first || c.slug === first.toLowerCase().replace(/\s+/g, "-"))?.slug ?? first;
      router.replace(`/catalogue?category=${encodeURIComponent(slug)}`, { scroll: false });
    }
  }, [category, suggestedSlugs, categoriesWithProducts, router]);

  const handleSortChange = useCallback((sort: SortOption) => {
    setTab(sort);
    setPage(0);
  }, []);

  const recipeTitle = getRecipeTitle(q);

  useEffect(() => {
    if (q.trim()) holmesSearch(q.trim());
  }, [q]);
  const addAllToCart = useCallback(() => {
    if (!catalogSlug) return;
    for (const hit of hits) {
      const id = (hit.recordId ?? hit.id) as string;
      const name = getDisplayName(hit);
      const rawPrice = getPrice(hit);
      const priceCents = rawPrice != null ? Math.round(rawPrice * 100) : 0;
      if (priceCents > 0) {
        addItem({
          recordId: id,
          tableSlug: catalogSlug,
          name,
          unitAmount: priceCents,
          imageUrl: getImageUrl(hit),
        });
      }
    }
  }, [hits, catalogSlug, addItem]);

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar filters (desktop) */}
        <CatalogueFilters
          categories={categoriesWithProducts}
          currentCategory={category}
          currentSort={tab}
          onSortChange={handleSortChange}
          storeName={store?.name}
          variant="sidebar"
          suggestedSlugs={suggestedSlugs}
          missionPrioritySlugs={missionPrioritySlugs}
        />

        {/* Mobile filters bar */}
        <div className="lg:hidden flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-aurora-surface border border-aurora-border hover:border-aurora-primary/40 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
          <span className="text-aurora-muted text-sm">
            {category ? categories.find((c) => c.slug === category)?.name ?? category : "All"} · {tab === "featured" ? "Featured" : tab === "bestsellers" ? "Bestsellers" : tab === "new" ? "New" : "On Sale"}
          </span>
        </div>

        {/* Main content - min-w-0 lets it shrink; flex-1 lets it grow to fill space */}
        <main className="flex-1 min-w-0 w-full sm:min-w-[280px] flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-xl sm:text-2xl font-bold">
                {recipeTitle
                  ? getTimeOfDay() === "evening"
                    ? `Make tonight: ${recipeTitle}`
                    : `Make: ${recipeTitle}`
                  : "Products"}
              </h1>
              {recipeTitle && hits.length > 0 && catalogSlug && (
                <button
                  type="button"
                  onClick={addAllToCart}
                  className="px-4 py-2 rounded-lg bg-aurora-primary text-white text-sm font-semibold hover:bg-aurora-primary-dark transition-colors"
                >
                  Add all to cart
                </button>
              )}
            </div>
            <SortDropdown value={tab} onChange={handleSortChange} />
          </div>

          {/* Holmes injects "Complete your [Recipe]" when recipe mission + cart has items */}
          <div data-holmes="basket-bundle" className="mb-6 min-h-[1px]" />

          {/* Holmes injects personalised "Recommended for you" block */}
          <div data-holmes="catalogue-list" className="mb-8 min-h-[1px]" />

          {/* For your mission - when narrowCatalog, show mission-scoped products */}
          {narrowCatalog && missionFocusHits.length > 0 && !recipeTitle && activeMission && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-aurora-muted uppercase tracking-widest mb-4">
                For your mission: {activeMission.label}
              </h2>
              <div className="grid gap-4 sm:gap-5 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
                {missionFocusHits.map((record) => {
                  const id = (record.recordId ?? record.id) as string;
                  const name = getDisplayName(record);
                  const rawPrice = getPrice(record);
                  const sellByWeight = Boolean(record.sell_by_weight);
                  const unit = (record.unit as string) || "kg";
                  const pricePerUnit = record.price_per_unit as number | undefined;
                  const priceCents =
                    sellByWeight && pricePerUnit != null
                      ? Math.round(pricePerUnit * 100)
                      : rawPrice != null
                        ? Math.round(rawPrice * 100)
                        : undefined;
                  const imageUrl = getImageUrl(record);
                  return (
                    <div
                      key={id}
                      className="group p-4 rounded-xl bg-aurora-surface border border-aurora-border hover:border-aurora-primary/40 transition-all overflow-hidden min-w-[160px] min-h-[260px] flex flex-col"
                    >
                      <Link href={`/catalogue/${id}`} className="block">
                        <div className="aspect-square rounded-lg bg-aurora-surface-hover mb-3 overflow-hidden">
                          <ProductImage
                            src={imageUrl}
                            className="w-full h-full"
                            objectFit="contain"
                            thumbnail
                            fallback={<div className="w-full h-full flex items-center justify-center text-aurora-muted text-4xl">-</div>}
                          />
                        </div>
                        <p className="font-semibold text-sm truncate group-hover:text-aurora-primary transition-colors">
                          {name}
                        </p>
                        {priceCents != null && (
                          <p className="text-sm mt-1 font-bold text-aurora-primary">
                            {sellByWeight && pricePerUnit != null
                              ? formatPrice(Math.round(pricePerUnit * 100), currency) + `/${unit}`
                              : formatPrice(priceCents, currency)}
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
                            sellByWeight={sellByWeight}
                            unit={unit}
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

          {/* Mobile filter drawer */}
          {filtersOpen && (
            <div className="lg:hidden mb-6 rounded-lg border border-aurora-border overflow-hidden">
              <CatalogueFilters
                categories={categoriesWithProducts}
                currentCategory={category}
                currentSort={tab}
                onSortChange={handleSortChange}
                storeName={store?.name}
                onClose={() => setFiltersOpen(false)}
                variant="drawer"
                suggestedSlugs={suggestedSlugs}
                missionPrioritySlugs={missionPrioritySlugs}
              />
            </div>
          )}

          {/* Loading/empty/grid - ensure full width so layout doesn't collapse */}
          <div className="min-h-[400px] w-full flex-1 min-w-0 flex">
          {loading && hits.length === 0 && store ? (
            <div className="grid gap-4 sm:gap-5 w-full transition-opacity duration-200 flex-1 min-w-0 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : recipeTitle ? (
            <div className="w-full flex-1">
              <RecipePageView
                recipeSlug={recipeTitle.toLowerCase()}
                recipeTitle={recipeTitle}
                currency={currency}
              />
            </div>
          ) : hits.length === 0 ? (
            <div className="w-full flex-1 flex items-start justify-center">
            <CatalogueEmptyState
              hasCategory={!!category}
              hasStore={!!store}
              categories={categoriesWithProducts}
            />
            </div>
          ) : (
            <div className="w-full flex-1 min-w-0">
            <>
              <div
                className={`grid gap-4 sm:gap-5 w-full transition-opacity duration-200 grid-cols-[repeat(auto-fill,minmax(160px,1fr))] ${
                  loading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {hits.map((record) => {
                  const id = (record.recordId ?? record.id) as string;
                  const name = getDisplayName(record);
                  const rawPrice = getPrice(record);
                  const sellByWeight = Boolean(record.sell_by_weight);
                  const unit = (record.unit as string) || "kg";
                  const pricePerUnit = record.price_per_unit as number | undefined;
                  const priceCents =
                    sellByWeight && pricePerUnit != null
                      ? Math.round(pricePerUnit * 100)
                      : rawPrice != null
                        ? Math.round(rawPrice * 100)
                        : undefined;
                  const imageUrl = getImageUrl(record);
                  const brand = getBrand(record);
                  const rating = getRating(record);

                  return (
                    <div
                      key={id}
                      className="group p-4 rounded-xl bg-aurora-surface border border-aurora-border hover:border-aurora-primary/40 hover:shadow-[0_10px_25px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden min-w-[160px] min-h-[280px] flex flex-col"
                    >
                      <Link href={`/catalogue/${id}`} className="block">
                        <div className="aspect-square rounded-lg bg-aurora-surface-hover mb-3 overflow-hidden">
                          <ProductImage
                            src={imageUrl}
                            className="w-full h-full"
                            objectFit="contain"
                            thumbnail
                            fallback={<div className="w-full h-full flex items-center justify-center text-aurora-muted text-4xl">-</div>}
                          />
                        </div>
                        {brand && (
                          <p className="text-xs text-aurora-muted truncate mb-0.5">{brand}</p>
                        )}
                        <p className="font-semibold text-sm sm:text-base truncate group-hover:text-aurora-primary transition-colors">
                          {name}
                        </p>
                        {(priceCents != null || (sellByWeight && pricePerUnit != null)) && (
                          <p className="text-sm mt-1 font-bold text-aurora-primary">
                            {sellByWeight && pricePerUnit != null
                              ? formatPrice(Math.round(pricePerUnit * 100), currency) + `/${unit}`
                              : formatPrice(priceCents!, currency)}
                          </p>
                        )}
                        {rating != null && rating > 0 && (
                          <p className="text-xs text-aurora-muted mt-1 flex items-center gap-1">
                            <span className="text-amber-500">★</span>
                            {rating.toFixed(1)}
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
                            sellByWeight={sellByWeight}
                            unit={unit}
                            imageUrl={imageUrl}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {total > limit && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 rounded-lg border border-aurora-border disabled:opacity-50 hover:bg-aurora-surface-hover transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-aurora-muted">
                    Page {page + 1} of {Math.ceil(total / limit)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={(page + 1) * limit >= total}
                    className="px-4 py-2 rounded-lg border border-aurora-border disabled:opacity-50 hover:bg-aurora-surface-hover transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function CataloguePage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto py-16 px-6 text-center text-aurora-muted">Loading…</div>}>
      <CatalogueContent />
    </Suspense>
  );
}
