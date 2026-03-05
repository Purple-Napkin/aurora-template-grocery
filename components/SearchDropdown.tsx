"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatPrice, toCents } from "@/lib/format-price";
import { search, type SearchHit } from "@/lib/aurora";
import { holmesSearch } from "@/lib/holmes-events";
import { useCart } from "./CartProvider";

const RECENT_KEY = "aurora-search-recent";
const RECENT_MAX = 5;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}
function saveRecent(terms: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECENT_KEY, JSON.stringify(terms.slice(0, RECENT_MAX)));
}

export function SearchDropdown({
  vendorId,
  placeholder = "Search milk, bananas, pasta…",
}: {
  vendorId?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  useEffect(() => {
    setRecentSearches(loadRecent());
  }, []);

  const addToRecent = useCallback((term: string) => {
    const t = term.trim().toLowerCase();
    if (!t) return;
    setRecentSearches((prev) => {
      const next = [t, ...prev.filter((x) => x !== t)].slice(0, RECENT_MAX);
      saveRecent(next);
      return next;
    });
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setHits([]);
      return;
    }
    holmesSearch(q.trim());
    setLoading(true);
    try {
      const res = await search({
        q: q.trim(),
        limit: 12,
        vendorId,
      });
      setHits(res.hits ?? []);
    } catch {
      setHits([]);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setHits([]);
      if (!open) return;
      setOpen(true);
      return;
    }
    setOpen(true);
    debounceRef.current = setTimeout(() => doSearch(query), 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories = [...new Set(hits.map((h) => (h as Record<string, unknown>).category_name ?? (h as Record<string, unknown>).category).filter(Boolean))].slice(0, 3) as string[];
  const brands = [...new Set(hits.map((h) => (h as Record<string, unknown>).brand ?? (h as Record<string, unknown>).brand_name).filter(Boolean))].slice(0, 3) as string[];

  const handleProductSelect = (hit: SearchHit, quickAdd?: boolean) => {
    addToRecent(query);
    if (quickAdd && hit.price != null && Number(hit.price) > 0 && hit.tableSlug) {
      addItem({
        recordId: hit.recordId,
        tableSlug: hit.tableSlug,
        name: hit.name ?? hit.title ?? hit.snippet ?? hit.recordId ?? "",
        unitAmount: toCents(hit.price) ?? 0,
        imageUrl: hit.image_url,
      });
    }
  };

  const showRecent = open && query.trim() && !loading && hits.length === 0 && recentSearches.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-[280px]">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-aurora-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => (query.trim() || recentSearches.length) && setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 h-9 text-sm rounded-lg bg-aurora-surface border border-aurora-border text-aurora-text placeholder:text-aurora-muted focus:outline-none focus:ring-1 focus:ring-aurora-primary/50 focus:border-aurora-primary/70"
          aria-label="Search products"
        />
      </div>
      {open && (query.trim() || showRecent) && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-component bg-aurora-surface border border-aurora-border shadow-xl z-[9999] max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-aurora-muted text-sm">Searching…</div>
          ) : hits.length === 0 && !showRecent ? (
            <div className="p-4 text-aurora-muted text-sm">No results</div>
          ) : (
            <div className="py-2">
              {hits.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-aurora-muted border-b border-aurora-border">Products</div>
                  <ul>
                    {hits.slice(0, 6).map((hit) => (
                      <li key={`${hit.tableSlug}-${hit.recordId}`} className="group/item">
                        <div className="flex items-center gap-3 px-4 py-2 hover:bg-aurora-surface-hover transition-colors">
                          <Link
                            href={`/catalogue/${hit.recordId}`}
                            onClick={() => { handleProductSelect(hit); setOpen(false); }}
                            className="flex items-center gap-3 flex-1 min-w-0"
                          >
                            {hit.image_url ? (
                              <img src={hit.image_url} alt="" className="w-10 h-10 rounded-component object-cover shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-component bg-aurora-surface-hover shrink-0 flex items-center justify-center text-aurora-muted">—</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{hit.name ?? hit.title ?? hit.snippet ?? hit.recordId}</p>
                              {hit.price != null && Number(hit.price) > 0 && (
                                <p className="text-sm text-aurora-primary font-semibold">{formatPrice(toCents(hit.price) ?? 0)}</p>
                              )}
                            </div>
                          </Link>
                          {hit.price != null && Number(hit.price) > 0 && (
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); handleProductSelect(hit, true); setOpen(false); }}
                              className="shrink-0 px-3 py-1.5 rounded-lg bg-aurora-primary text-white text-xs font-medium hover:bg-aurora-primary-dark transition-colors opacity-0 group-hover/item:opacity-100"
                            >
                              Quick add
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {categories.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-aurora-muted border-t border-b border-aurora-border mt-1">Categories</div>
                      <ul>
                        {categories.map((cat) => (
                          <li key={cat}>
                            <Link
                              href={`/catalogue?category=${encodeURIComponent(String(cat).toLowerCase().replace(/\s+/g, "-"))}`}
                              onClick={() => { addToRecent(query); setOpen(false); }}
                              className="flex items-center gap-3 px-4 py-2 hover:bg-aurora-surface-hover transition-colors"
                            >
                              <span className="font-medium truncate">{cat}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {brands.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-aurora-muted border-t border-b border-aurora-border mt-1">Brands</div>
                      <ul>
                        {brands.map((brand) => (
                          <li key={brand}>
                            <Link
                              href={`/catalogue?q=${encodeURIComponent(brand)}`}
                              onClick={() => { addToRecent(query); setOpen(false); }}
                              className="flex items-center gap-3 px-4 py-2 hover:bg-aurora-surface-hover transition-colors"
                            >
                              <span className="font-medium truncate">{brand}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}
              {showRecent && (
                <>
                  <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-aurora-muted border-b border-aurora-border">Recent searches</div>
                  <ul>
                    {recentSearches.map((term) => (
                      <li key={term}>
                        <button
                          type="button"
                          onClick={() => { setQuery(term); doSearch(term); }}
                          className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-aurora-surface-hover transition-colors"
                        >
                          <Search className="w-4 h-4 text-aurora-muted shrink-0" />
                          <span className="font-medium truncate">{term}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
