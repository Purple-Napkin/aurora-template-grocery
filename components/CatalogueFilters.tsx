"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { HolmesSprinkleIcon } from "./HolmesSprinkleIcon";

export type CategoryItem = { name: string; slug: string };

export type SortOption = "featured" | "bestsellers" | "new" | "sale";

export const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "bestsellers", label: "Bestsellers" },
  { id: "new", label: "New Arrivals" },
  { id: "sale", label: "On Sale" },
];

type CatalogueFiltersProps = {
  categories: CategoryItem[];
  currentCategory: string;
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  storeName?: string;
  onClose?: () => void;
  variant?: "sidebar" | "drawer";
  suggestedSlugs?: string[];
};

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-b border-aurora-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full py-3 text-left"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider text-aurora-muted">
          {title}
        </h3>
        <ChevronDown className={`w-4 h-4 text-aurora-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </section>
  );
}

export function CatalogueFilters({
  categories,
  currentCategory,
  currentSort,
  onSortChange,
  storeName,
  onClose,
  variant = "sidebar",
  suggestedSlugs = [],
}: CatalogueFiltersProps) {
  const content = (
    <div className="space-y-0">
      {/* Categories */}
      <FilterSection title="Categories">
        <nav className="space-y-1">
          <Link
            href="/catalogue"
            onClick={onClose}
            className={`block px-3 py-2 rounded-component text-sm font-medium transition-colors ${
              !currentCategory
                ? "bg-aurora-accent/20 text-aurora-accent border border-aurora-accent/40"
                : "text-aurora-muted hover:text-aurora-text hover:bg-aurora-surface-hover border border-transparent"
            }`}
          >
            All categories
          </Link>
          {[...categories]
            .sort((a, b) => {
              const aSuggested = suggestedSlugs.includes(a.slug);
              const bSuggested = suggestedSlugs.includes(b.slug);
              if (aSuggested && !bSuggested) return -1;
              if (!aSuggested && bSuggested) return 1;
              return 0;
            })
            .map((cat) => {
              const isSuggested = suggestedSlugs.includes(cat.slug);
              return (
              <Link
                key={cat.slug}
                href={`/catalogue?category=${encodeURIComponent(cat.slug)}`}
                onClick={onClose}
                className={`flex items-center gap-2 px-3 py-2 rounded-component text-sm font-medium transition-colors ${
                  currentCategory === cat.slug
                    ? "bg-aurora-accent/20 text-aurora-accent border border-aurora-accent/40"
                    : "text-aurora-muted hover:text-aurora-text hover:bg-aurora-surface-hover border border-transparent"
                }`}
              >
                {isSuggested && <HolmesSprinkleIcon className="shrink-0" />}
                {cat.name}
              </Link>
            );
          })}
        </nav>
      </FilterSection>

      {/* Sort */}
      <FilterSection title="Sort by" defaultOpen={true}>
        <div className="space-y-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onSortChange(opt.id);
                onClose?.();
              }}
              className={`w-full text-left px-3 py-2 rounded-component text-sm font-medium transition-colors ${
                currentSort === opt.id
                  ? "bg-aurora-accent/20 text-aurora-accent border border-aurora-accent/40"
                  : "text-aurora-muted hover:text-aurora-text hover:bg-aurora-surface-hover border border-transparent"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {storeName && (
        <p className="text-xs text-aurora-muted pt-2 border-t border-aurora-border">
          Showing products from {storeName}
        </p>
      )}
    </div>
  );

  if (variant === "drawer") {
    return (
      <div className="bg-aurora-surface border-t border-aurora-border p-6">
        {content}
      </div>
    );
  }

  return (
    <aside className="w-56 shrink-0 hidden lg:block">
      <div className="sticky top-24 space-y-6 rounded-component bg-aurora-surface/50 border border-aurora-border p-4">
        {content}
      </div>
    </aside>
  );
}
