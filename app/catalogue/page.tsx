"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";
import { useStore } from "@/components/StoreContext";
import { formatPrice, toCents } from "@/lib/format-price";
import { search, createAuroraClient } from "@/lib/aurora";
import type { SearchHit } from "@/lib/aurora";
import {
  CatalogueFilters,
  type CategoryItem,
  type SortOption,
} from "@/components/CatalogueFilters";
import { SortDropdown } from "@/components/SortDropdown";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { CatalogueEmptyState } from "@/components/CatalogueEmptyState";

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
  const category = searchParams.get("category") ?? "";
  const q = searchParams.get("q") ?? "";
  const { store } = useStore();
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
  const limit = 24;

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
    setLoading(true);
    try {
      const sort = tab === "new" ? "created_at" : tab === "sale" ? "price" : "name";
      const order = tab === "new" ? "desc" : "asc";
      const res = await search({
        q: q.trim() || undefined,
        limit,
        offset: page * limit,
        vendorId: store?.id,
        category: category || undefined,
        sort,
        order,
      });
      setHits(res.hits ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setHits([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [store?.id, category, q, tab, page]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const aurora = createAuroraClient();
        const config = await aurora.store.config();
        if (config.enabled && config.catalogTableSlug) {
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
  }, [categories, store?.id]);

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
    const t = setTimeout(fetchSuggested, 2000);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  const handleSortChange = useCallback((sort: SortOption) => {
    setTab(sort);
    setPage(0);
  }, []);

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
            <h1 className="font-display text-xl sm:text-2xl font-bold">Products</h1>
            <SortDropdown value={tab} onChange={handleSortChange} />
          </div>

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
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-aurora-muted text-4xl">
                              —
                            </div>
                          )}
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
