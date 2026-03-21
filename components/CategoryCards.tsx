"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Baby,
  Beer,
  Candy,
  Cat,
  Wheat,
  Sparkles,
  CupSoda,
  Droplets,
  HeartPulse,
  Apple,
  Drumstick,
  Shirt,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { ProductImage } from "@aurora-studio/starter-core";

/** Map category slug to icon when no image provided */
function getCategoryIcon(slug: string): LucideIcon {
  const s = slug.toLowerCase().replace(/\s+/g, "-");
  const map: Record<string, LucideIcon> = {
    "baby-food": Baby,
    baby: Baby,
    beer: Beer,
    candy: Candy,
    "cat-food": Cat,
    cat: Cat,
    cereal: Wheat,
    "biscuits-cereal-bars": Candy,
    "bread-rolls": Wheat,
    cleaning: Sparkles,
    dishwashing: Sparkles,
    tea: CupSoda,
    water: Droplets,
    "health-care": HeartPulse,
    healthcare: HeartPulse,
    juices: Apple,
    juice: Apple,
    poultry: Drumstick,
    "skin-care": Shirt,
    skincare: Shirt,
    vegetables: Apple,
    fruits: Apple,
    dairy: Droplets,
    bakery: Wheat,
    snacks: Candy,
    beverages: CupSoda,
    cheese: Apple,
    chocolate: Candy,
    "canned-food": UtensilsCrossed,
    "oil-vinegar": Droplets,
    fries: UtensilsCrossed,
  };
  for (const [key, icon] of Object.entries(map)) {
    if (s === key || s.includes(key) || key.includes(s)) return icon;
  }
  return UtensilsCrossed;
}

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
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
      {ordered.map((cat) => (
        <Link
          key={cat.slug}
          href={`/catalogue?category=${encodeURIComponent(cat.slug)}`}
          className="group block rounded-xl overflow-hidden bg-aurora-surface border border-aurora-border hover:border-aurora-primary/60 hover:shadow-lg hover:shadow-aurora-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <div
            className={`aspect-square relative bg-gradient-to-br ${gradientForSlug(cat.slug)}`}
          >
            {cat.image_url ? (
              <div className="absolute inset-0">
                <ProductImage
                  src={cat.image_url}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  fallback={null}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="opacity-40 group-hover:opacity-60 transition-opacity">
                  {(() => {
                    const Icon = getCategoryIcon(cat.slug);
                    return <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={1.5} aria-hidden />;
                  })()}
                </span>
              </div>
            )}
            <div className="absolute inset-0 flex items-end p-2 sm:p-3 bg-gradient-to-t from-black/50 via-transparent to-transparent">
              <span className="font-semibold text-xs sm:text-sm text-white drop-shadow-md line-clamp-2">
                {cat.name}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
