"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useStore } from "./StoreContext";

type Category = { name: string; slug: string };

const DEFAULT_CATEGORIES: Category[] = [
  { name: "Bakery Items", slug: "bakery-items" },
  { name: "Frozen Foods", slug: "frozen-foods" },
  { name: "Vegetables", slug: "vegetables" },
  { name: "Fruits", slug: "fruits" },
  { name: "Dairy Products", slug: "dairy-products" },
  { name: "Snacks", slug: "snacks" },
  { name: "Beverages", slug: "beverages" },
];

export function CategoriesMegaMenu() {
  const { store } = useStore();
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = store?.id
      ? `/api/categories?vendorId=${encodeURIComponent(store.id)}`
      : "/api/categories";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, [store?.id]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1 px-3 py-2 rounded-component text-sm font-medium text-aurora-muted hover:text-aurora-text transition-colors"
      >
        All Categories
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 pt-1">
          <div className="rounded-xl bg-aurora-surface border border-aurora-border shadow-xl py-3 min-w-[200px] z-[200]">
            <Link
              href="/catalogue"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-aurora-muted hover:text-aurora-text hover:bg-aurora-surface-hover transition-colors"
            >
              All categories
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/catalogue?category=${encodeURIComponent(cat.slug)}`}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-aurora-muted hover:text-aurora-text hover:bg-aurora-surface-hover transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
