"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ProductImage } from "@aurora-studio/starter-core";
import { ChefHat } from "lucide-react";
import { getTimeOfDay } from "@aurora-studio/starter-core";
import { useStore } from "@aurora-studio/starter-core";
import { RecipeProductCollage } from "./RecipeProductCollage";
import { useMissionAware } from "@/components/MissionAwareHome";
import { isTravelLikeMission } from "@/lib/intent-mission";
import {
  BlurbBlock,
  ContentBlockProductCard,
  CONTENT_BLOCK_CARD_FOOTER_BAND,
  CONTENT_BLOCK_CARD_SHELL,
  CONTENT_BLOCK_IMAGE_WELL,
  groupHalfWidthSections,
  type StoreContentSection,
} from "./storeContentBlocksUi";

type Section = {
  type?: string;
  title: string;
  subtitle?: string;
  products?: Array<{
    id: string;
    name: string;
    price?: number;
    image_url?: string;
    description?: string;
    category?: string;
    category_slug?: string;
  }>;
  cards?: Array<{ title: string; imageUrl: string | null; linkUrl: string }>;
  imageUrl?: string | null;
  blockKind?: "product_list" | "search_terms" | "blurb" | "image_blurb";
  body?: string;
  linkHref?: string;
  linkLabel?: string;
  layoutWidth?: "full" | "half";
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
      if (section.blockKind === "search_terms") return "Matched search picks";
      if (section.blockKind === "product_list") return "Curated picks";
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
  image_url?: string | null;
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
  const currencyCode = currency.length >= 3 ? currency.toUpperCase() : "GBP";
  const missionAware = useMissionAware();
  const suppressRecipeForward =
    missionAware?.activeMission?.band === "high" &&
    isTravelLikeMission(missionAware.activeMission.key);

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
      <div ref={ref} data-holmes="home-sections" className="py-8 sm:py-10">
        {children}
      </div>
    );
  }

  const renderHolmesSection = (sec: Section, key: string): ReactNode => {
    const trustSignal = getTrustSignal(sec, timeOfDay, store?.name);

    if (sec.type === "meals" && recipes.length > 0) {
      return null;
    }

    const isBlurbLike =
      sec.blockKind === "blurb" ||
      sec.blockKind === "image_blurb" ||
      (sec.type === "promo" && !sec.products?.length && !sec.cards?.length);
    if (isBlurbLike) {
      const t = (sec.title || "").trim();
      if (!sec.body?.trim() && !t && !sec.imageUrl) return null;
      return (
        <div key={key} className="min-w-0 h-full">
          <BlurbBlock sec={sec as StoreContentSection} withHolmesMarkers={false} />
        </div>
      );
    }

    if (sec.type === "inspiration") {
      if (!sec.cards?.length) return null;
      return (
        <section key={key} className="space-y-5 min-w-0">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-aurora-text sm:text-xl">
              {sec.title}
            </h2>
            {sec.subtitle && (
              <p className="text-sm text-aurora-muted mt-2 leading-relaxed max-w-2xl">{sec.subtitle}</p>
            )}
          </div>
          <div className="grid grid-cols-2 items-start gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
            {sec.cards.map((card, j) => (
              <Link
                key={j}
                href={card.linkUrl || "/catalogue"}
                className={`flex flex-col overflow-hidden rounded-2xl bg-white ${CONTENT_BLOCK_CARD_SHELL}`}
              >
                <div className={CONTENT_BLOCK_IMAGE_WELL}>
                  <ProductImage
                    src={card.imageUrl}
                    className="absolute inset-0 h-full w-full"
                    objectFit="cover"
                    thumbnail
                    fallback={
                      <span className="flex h-full min-h-[5rem] w-full items-center justify-center px-2 text-center text-sm text-aurora-muted">
                        {card.title}
                      </span>
                    }
                  />
                </div>
                <div className={CONTENT_BLOCK_CARD_FOOTER_BAND}>
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900">
                    {card.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      );
    }

    if (sec.products && sec.products.length > 0) {
      return (
        <section key={key} className="space-y-5 min-w-0">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <div className="min-w-0">
              {sec.type === "for_you" ? (
                <p className="text-[0.6875rem] font-medium text-aurora-muted/90 uppercase tracking-[0.16em] mb-1.5">
                  Curated
                </p>
              ) : null}
              <h2
                className={
                  sec.type === "for_you"
                    ? "font-display text-xl font-semibold tracking-[-0.02em] text-aurora-text sm:text-2xl"
                    : "font-display text-lg font-semibold tracking-[-0.02em] text-aurora-text sm:text-xl"
                }
              >
                {sec.title}
              </h2>
            </div>
            {trustSignal && (
              <span className="text-xs text-aurora-muted/90 font-medium shrink-0">{trustSignal}</span>
            )}
          </div>
          <div className="grid grid-cols-2 items-start gap-4 sm:grid-cols-3 lg:grid-cols-5 sm:gap-5">
            {sec.products.map((prod) => (
              <ContentBlockProductCard
                key={prod.id}
                prod={prod}
                currency={currencyCode}
                withHolmesMarkers={false}
              />
            ))}
          </div>
        </section>
      );
    }

    if (sec.cards && sec.cards.length > 0) {
      return (
        <section key={key} className="space-y-5 min-w-0">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-aurora-text sm:text-xl">
              {sec.title}
            </h2>
            {trustSignal && (
              <span className="text-xs text-aurora-muted/90 font-medium">{trustSignal}</span>
            )}
          </div>
          <div className="grid grid-cols-2 items-start gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
            {sec.cards.map((card, j) => (
              <Link
                key={j}
                href={card.linkUrl || "/catalogue"}
                className={`flex flex-col overflow-hidden rounded-2xl bg-white ${CONTENT_BLOCK_CARD_SHELL}`}
              >
                <div className={CONTENT_BLOCK_IMAGE_WELL}>
                  <ProductImage
                    src={card.imageUrl}
                    className="absolute inset-0 h-full w-full"
                    objectFit="cover"
                    thumbnail
                    fallback={
                      <span className="flex h-full min-h-[5rem] w-full items-center justify-center text-sm text-aurora-muted">
                        {card.title}
                      </span>
                    }
                  />
                </div>
                <div className={CONTENT_BLOCK_CARD_FOOTER_BAND}>
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900">
                    {card.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      );
    }

    return null;
  };

  const grouped = groupHalfWidthSections(sections as StoreContentSection[]);

  const recipeHolmesRail =
    recipes.length > 0 && !suppressRecipeForward ? (
      <section className="space-y-5 pt-10 mt-4">
        <h2 className="font-display text-lg sm:text-xl font-semibold tracking-[-0.02em] text-aurora-text flex items-center gap-3">
          <ChefHat className="w-5 h-5 text-aurora-primary shrink-0" aria-hidden />
          Common next steps
        </h2>
        <p className="text-sm text-aurora-muted max-w-2xl leading-relaxed">
          Recipes — optional inspiration when you&apos;re cooking, not the main shop story.
        </p>
        <div className="grid grid-cols-2 items-start gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
          {recipes.slice(0, 4).map((r) => (
            <Link
              key={r.id}
              href={`/recipes/${encodeURIComponent(r.slug)}`}
              className={`flex flex-col overflow-hidden rounded-2xl bg-white ${CONTENT_BLOCK_CARD_SHELL}`}
            >
              <div className={CONTENT_BLOCK_IMAGE_WELL}>
                <RecipeProductCollage
                  imageUrl={r.image_url}
                  imageUrls={r.productImageUrls ?? []}
                  className="absolute inset-0 h-full w-full"
                />
              </div>
              <div className={CONTENT_BLOCK_CARD_FOOTER_BAND}>
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900">
                  {r.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    ) : null;

  return (
    <div ref={ref} data-holmes="home-sections" className="py-8 sm:py-10">
      <div className="space-y-12 sm:space-y-14">
        {grouped.map((g, gi) => {
          if (g.mode === "pair") {
            return (
              <div
                key={`pair-${gi}`}
                className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch"
              >
                {g.secs.map((sec, si) =>
                  renderHolmesSection(sec as Section, `p-${gi}-${si}`)
                )}
              </div>
            );
          }
          return renderHolmesSection(g.sec as Section, `f-${gi}`);
        })}
        {recipeHolmesRail}
      </div>
    </div>
  );
}
