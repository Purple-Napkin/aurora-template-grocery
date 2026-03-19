"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";

/** Strong gradient presets – each category gets a stable color from slug hash */
const CARD_GRADIENTS = [
  "from-emerald-600/35 via-teal-500/25 to-cyan-600/30",
  "from-amber-600/35 via-orange-500/25 to-red-500/30",
  "from-rose-600/35 via-pink-500/25 to-fuchsia-500/30",
  "from-violet-600/35 via-purple-500/25 to-indigo-500/30",
  "from-sky-600/35 via-blue-500/25 to-cyan-500/30",
  "from-lime-600/35 via-green-500/25 to-emerald-500/30",
  "from-amber-700/30 via-yellow-500/20 to-lime-500/25",
  "from-rose-700/30 via-red-500/20 to-orange-500/25",
];

function gradientForSlug(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash << 5) - hash + slug.charCodeAt(i);
  return CARD_GRADIENTS[Math.abs(hash) % CARD_GRADIENTS.length];
}

type Category = { name: string; slug: string; image_url?: string };

export function CategoryCards() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [suggestedSlugs, setSuggestedSlugs] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      (() => {
        const sid = (window as { holmes?: { getSessionId?: () => string } }).holmes?.getSessionId?.();
        if (!sid) return Promise.resolve({ suggested: [] });
        return fetch(`/api/category-suggestions?sid=${encodeURIComponent(sid)}`).then((r) =>
          r.ok ? r.json() : { suggested: [] }
        );
      })(),
    ]).then(([catRes, sugRes]) => {
      if (cancelled) return;
      const cats = (catRes.categories ?? []) as Category[];
      setCategories(cats);
      setSuggestedSlugs((sugRes.suggested ?? []) as string[]);
    });
    return () => { cancelled = true; };
  }, []);

  // Order: suggested first, then rest
  const ordered =
    suggestedSlugs.length > 0
      ? [
          ...suggestedSlugs
            .map((slug) => categories.find((c) => c.slug === slug || c.slug === slug.toLowerCase().replace(/\s+/g, "-")))
            .filter((c): c is Category => Boolean(c)),
          ...categories.filter((c) => !suggestedSlugs.some((s) => s === c.slug || s === c.slug.toLowerCase().replace(/\s+/g, "-"))),
        ]
      : categories;

  if (ordered.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {ordered.map((cat, i) => (
        <Link
          key={cat.slug}
          href={`/catalogue?category=${encodeURIComponent(cat.slug)}`}
          className="group block rounded-2xl overflow-hidden bg-aurora-surface border-2 border-aurora-border hover:border-aurora-primary/60 hover:shadow-xl hover:shadow-aurora-primary/15 hover:scale-[1.02] active:scale-[0.99] transition-all duration-200"
        >
          <div
            className={`aspect-[4/3] relative bg-gradient-to-br ${gradientForSlug(cat.slug)}`}
          >
            {cat.image_url ? (
              <div className="absolute inset-0">
                <ProductImage
                  src={cat.image_url}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  fallback={null}
                />
              </div>
            ) : null}
            <div className="absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/40 via-transparent to-transparent">
              <span className="font-bold text-sm sm:text-base text-white drop-shadow-md">
                {cat.name}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
