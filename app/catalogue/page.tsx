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
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";

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

function CatalogueContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? "";
  const { store } = useStore();
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<SortOption>("featured");
  const [catalogSlug, setCatalogSlug] = useState<string | null>(null);
  const [currency, setCurrency] = useState("GBP");
  const [page, setPage] = useState(0);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [suggestedSlugs, setSuggestedSlugs] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const limit = 24;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const aurora = createAuroraClient();
        const config = await aurora.store.config();
        const categorySlug = (config as { categoryTableSlug?: string }).categoryTableSlug;
        if (!cancelled && config.enabled && categorySlug) {
          const { data } = await aurora.tables(categorySlug).records.list({ limit: 20 });
          if (data?.length) {
            setCategories(
              data.map((r: Record<string, unknown>) => ({
                name: String(r.name ?? r.slug ?? r.id ?? ""),
                slug: String(r.slug ?? r.name ?? r.id ?? "")
                  .toLowerCase()
                  .replace(/\s+/g, "-"),
              }))
            );
          }
        }
      } catch {
        /* use defaults */
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
        q: "",
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
  }, [store?.id, category, tab, page]);

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
          categories={categories}
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
            className="flex items-center gap-2 px-4 py-2 rounded-component bg-aurora-surface/80 border border-aurora-border hover:border-aurora-accent/40 text-sm font-medium"
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

        {/* Main content */}
        <main className="flex-1 min-w-0 sm:min-w-[280px]">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Products</h1>

          {/* Mobile filter drawer */}
          {filtersOpen && (
            <div className="lg:hidden mb-6 rounded-component border border-aurora-border overflow-hidden">
              <CatalogueFilters
                categories={categories}
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

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
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

                  return (
                    <div
                      key={id}
                      className="group p-4 rounded-component bg-aurora-surface/80 border border-aurora-border hover:border-aurora-accent/40 hover:shadow-lg transition-all overflow-hidden"
                    >
                      <Link href={`/catalogue/${id}`} className="block">
                        <div className="aspect-square rounded-component bg-aurora-surface-hover mb-3 overflow-hidden">
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
                        <p className="font-semibold text-sm sm:text-base truncate group-hover:text-aurora-accent transition-colors">
                          {name}
                        </p>
                        {(priceCents != null || (sellByWeight && pricePerUnit != null)) && (
                          <p className="text-sm mt-1 font-bold text-aurora-accent">
                            {sellByWeight && pricePerUnit != null
                              ? formatPrice(Math.round(pricePerUnit * 100), currency) + `/${unit}`
                              : formatPrice(priceCents!, currency)}
                          </p>
                        )}
                      </Link>
                      {priceCents != null && catalogSlug && (
                        <div className="mt-3">
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
              {hits.length === 0 && (
                <p className="text-center text-aurora-muted py-12">
                  {category
                    ? "No products in this category yet. Try another category or add products in Aurora Studio."
                    : !store
                      ? "Select a store to see products."
                      : "No products yet. Add products in Aurora Studio."}
                </p>
              )}
              {total > limit && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 rounded-component border border-aurora-border disabled:opacity-50"
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
                    className="px-4 py-2 rounded-component border border-aurora-border disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
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
