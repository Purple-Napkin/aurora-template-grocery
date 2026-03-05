"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatPrice, toCents } from "@/lib/format-price";
import { search, type SearchHit } from "@/lib/aurora";
import { holmesSearch } from "@/lib/holmes-events";

export function SearchDropdown({
  vendorId,
  placeholder = "Search products…",
}: {
  vendorId?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
        limit: 8,
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
      setOpen(false);
      return;
    }
    setOpen(true);
    debounceRef.current = setTimeout(() => doSearch(query), 250);
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

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-aurora-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 rounded-component bg-aurora-surface border border-aurora-border text-white placeholder:text-aurora-muted focus:outline-none focus:ring-2 focus:ring-aurora-accent/50"
          aria-label="Search products"
        />
      </div>
      {open && query && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-component bg-aurora-surface border border-aurora-border shadow-xl z-[9999] max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-aurora-muted text-sm">Searching…</div>
          ) : hits.length === 0 ? (
            <div className="p-4 text-aurora-muted text-sm">No results</div>
          ) : (
            <ul className="py-2">
              {hits.map((hit) => (
                <li key={`${hit.tableSlug}-${hit.recordId}`}>
                  <Link
                    href={`/catalogue/${hit.recordId}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-aurora-surface-hover transition-colors"
                  >
                    {hit.image_url ? (
                      <img
                        src={hit.image_url}
                        alt=""
                        className="w-10 h-10 rounded-component object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-component bg-aurora-surface-hover shrink-0 flex items-center justify-center text-aurora-muted">
                        —
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {hit.name ?? hit.title ?? hit.snippet ?? hit.recordId}
                      </p>
                      {hit.price != null && (
                        <p className="text-sm text-aurora-accent">
                          {formatPrice(toCents(hit.price) ?? 0)}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
