"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ProductImage } from "aurora-starter-core";
import { ChefHat } from "lucide-react";
import { getTimeOfDay } from "aurora-starter-core";
import { useStore } from "aurora-starter-core";
import { RecipeProductCollage } from "./RecipeProductCollage";

const CURRENCY_SYMBOLS: Record<string, string> = {
  gbp: "£",
  usd: "$",
  eur: "€",
  aud: "A$",
};

type Section = {
  type?: string;
  title: string;
  subtitle?: string;
  products?: Array<{ id: string; name: string; price?: number; image_url?: string }>;
  cards?: Array<{ title: string; imageUrl: string | null; linkUrl: string }>;
};

type HomeData = {
  sections: Section[];
  hero?: unknown;
  timeOfDay?: "morning" | "afternoon" | "evening";
};

/** Trust signal for section - builds user confidence */
function getTrustSignal(section: Section, timeOfDay: string, storeName?: string): string | null {
  switch (section.type) {
    case "meals":
      return timeOfDay === "evening" ? "Because it's dinner time" : `For ${timeOfDay}`;
    case "for_you":
      return "Based on your browsing";
    case "top_up":
      return "Popular essentials";
    case "featured":
      return storeName ? `Popular at ${storeName}` : "Popular right now";
    default:
      return null;
  }
}

type RecipeWithProducts = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  productImageUrls?: string[];
};

/** Single adaptive feed - listens for Holmes data, renders with trust signals */
export function AdaptiveFeed({
  children,
  recipes,
  currency = "gbp",
}: {
  children: React.ReactNode;
  recipes: RecipeWithProducts[];
  currency?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [holmesData, setHolmesData] = useState<HomeData | null>(null);
  const { store } = useStore();
  const clientTimeOfDay = getTimeOfDay();
  const timeOfDay = holmesData?.timeOfDay ?? clientTimeOfDay;
  const symbol = CURRENCY_SYMBOLS[currency] ?? "£";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: Event) => {
      const ev = e as CustomEvent<HomeData>;
      if (ev.detail?.sections?.length) {
        e.preventDefault();
        setHolmesData(ev.detail);
      }
    };
    el.addEventListener("holmes:homeSections", handler);
    return () => el.removeEventListener("holmes:homeSections", handler);
  }, []);

  const sections = holmesData?.sections ?? null;

  if (!sections) {
    return (
      <div ref={ref} data-holmes="home-sections" className="py-6">
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} data-holmes="home-sections" className="py-6">
      <div className="space-y-10">
        {sections.map((sec, i) => {
          const trustSignal = getTrustSignal(sec, timeOfDay, store?.name);

          if (sec.type === "meals" && recipes.length > 0) {
            return (
              <section key={i} className="space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-lg font-bold text-aurora-text flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-aurora-primary" />
                    {sec.title || "Recipe ideas"}
                  </h2>
                  {trustSignal && (
                    <span className="text-xs text-aurora-muted font-medium">{trustSignal}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {recipes.slice(0, 4).map((r) => (
                    <Link
                      key={r.id}
                      href={`/recipes/${encodeURIComponent(r.slug)}`}
                      className="block p-3 rounded-xl bg-aurora-surface border border-aurora-border hover:border-aurora-primary/40 transition-all"
                    >
                      <div className="aspect-square rounded-lg mb-2 overflow-hidden">
                        <RecipeProductCollage
                          imageUrls={r.productImageUrls ?? []}
                          className="w-full h-full"
                        />
                      </div>
                      <p className="font-semibold text-sm truncate">{r.title}</p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          }

          if (sec.type === "inspiration") {
            if (!sec.cards?.length) return null;
            return (
              <section key={i} className="space-y-3">
                <div>
                  <h2 className="text-lg font-bold text-aurora-text">{sec.title}</h2>
                  {sec.subtitle && (
                    <p className="text-sm text-aurora-muted mt-0.5">{sec.subtitle}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {sec.cards.map((card, j) => (
                    <Link
                      key={j}
                      href={card.linkUrl || "/catalogue"}
                      className="block p-3 rounded-xl bg-aurora-surface border border-aurora-border hover:border-aurora-primary/40 transition-all"
                    >
                      <div className="aspect-square rounded-lg bg-aurora-surface-hover mb-2 overflow-hidden">
                        <ProductImage
                          src={card.imageUrl}
                          className="w-full h-full"
                          objectFit="contain"
                          thumbnail
                          fallback={
                            <span className="w-full h-full flex items-center justify-center text-aurora-muted text-sm text-center px-2">
                              {card.title}
                            </span>
                          }
                        />
                      </div>
                      <p className="font-semibold text-sm truncate">{card.title}</p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          }

          if (sec.products && sec.products.length > 0) {
            return (
              <section key={i} className="space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-lg font-bold text-aurora-text">{sec.title}</h2>
                  {trustSignal && (
                    <span className="text-xs text-aurora-muted font-medium">{trustSignal}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {sec.products.map((prod) => (
                    <Link
                      key={prod.id}
                      href={`/catalogue/${prod.id}`}
                      className="block p-3 rounded-xl bg-aurora-surface border border-aurora-border hover:border-aurora-primary/40 transition-all"
                    >
                      <div className="aspect-square rounded-lg bg-aurora-surface-hover mb-2 overflow-hidden">
                        <ProductImage
                          src={prod.image_url}
                          className="w-full h-full"
                          objectFit="contain"
                          thumbnail
                          fallback={
                            <span className="w-full h-full flex items-center justify-center text-aurora-muted text-lg">-</span>
                          }
                        />
                      </div>
                      <p className="font-semibold text-sm truncate">{prod.name}</p>
                      {prod.price != null && Number(prod.price) > 0 && (
                        <p className="text-sm font-bold text-aurora-primary">
                          {symbol}{Number(prod.price).toFixed(2)}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            );
          }

          if (sec.cards && sec.cards.length > 0) {
            return (
              <section key={i} className="space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-lg font-bold text-aurora-text">{sec.title}</h2>
                  {trustSignal && (
                    <span className="text-xs text-aurora-muted font-medium">{trustSignal}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {sec.cards.map((card, j) => (
                    <Link
                      key={j}
                      href={card.linkUrl || "/catalogue"}
                      className="block p-3 rounded-xl bg-aurora-surface border border-aurora-border hover:border-aurora-primary/40 transition-all"
                    >
                      <div className="aspect-square rounded-lg bg-aurora-surface-hover mb-2 overflow-hidden">
                        <ProductImage
                          src={card.imageUrl}
                          className="w-full h-full"
                          objectFit="contain"
                          thumbnail
                          fallback={
                            <span className="w-full h-full flex items-center justify-center text-aurora-muted text-sm">
                              {card.title}
                            </span>
                          }
                        />
                      </div>
                      <p className="font-semibold text-sm truncate">{card.title}</p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
