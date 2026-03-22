import Link from "next/link";
import type { ReactNode } from "react";
import { ProductImage } from "@aurora-studio/starter-core";
import { ChefHat, ShoppingBasket } from "lucide-react";
import {
  ContentBlockProductCard,
  CONTENT_BLOCK_CARD_FOOTER_BAND,
  CONTENT_BLOCK_CARD_SHELL,
  CONTENT_BLOCK_IMAGE_WELL,
} from "./ContentBlockProductCard";
import { RecipeProductCollage } from "./RecipeProductCollage";

/** Mirrors `HomePersonalizationSection` from the API / SDK (grocery pins types until SDK is republished). */
export type StoreContentSection = {
  type: "meals" | "top_up" | "inspiration" | "promo" | "for_you" | "featured";
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

export type RecipeWithProducts = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  productImageUrls?: string[];
};

function SectionShell({
  children,
  className = "",
  withHolmesMarkers = true,
}: {
  children: ReactNode;
  className?: string;
  withHolmesMarkers?: boolean;
}) {
  return (
    <div
      {...(withHolmesMarkers ? { "data-holmes-home-section": true } : {})}
      className={`min-w-0 ${className}`}
    >
      {children}
    </div>
  );
}

export function BlurbBlock({
  sec,
  withHolmesMarkers = true,
}: {
  sec: StoreContentSection;
  withHolmesMarkers?: boolean;
}) {
  const title = (sec.title || "").trim();
  const href = sec.linkHref?.trim();
  const label = sec.linkLabel?.trim() || "Learn more";

  /** Full-bleed banner + readable measure on copy (avoids long line lengths on wide feeds). */
  const isImageBlurb = sec.blockKind === "image_blurb" && Boolean(sec.imageUrl?.trim());

  if (isImageBlurb) {
    return (
      <SectionShell
        withHolmesMarkers={withHolmesMarkers}
        className="mb-10 last:mb-0 rounded-xl bg-aurora-surface border border-aurora-border overflow-hidden shadow-sm"
      >
        <div className="relative w-full h-44 sm:h-52 md:h-60">
          <ProductImage
            src={sec.imageUrl}
            className="absolute inset-0 w-full h-full object-cover"
            thumbnail
            fallback={<div className="absolute inset-0 bg-aurora-surface-hover" />}
          />
        </div>
        <div className="px-5 sm:px-8 py-5 sm:py-6">
          <div className="max-w-prose mx-auto space-y-3 text-center sm:text-left">
            {title ? (
              <h2
                {...(withHolmesMarkers ? { "data-holmes-home-section-title": true } : {})}
                className="text-xl font-bold text-aurora-text"
              >
                {title}
              </h2>
            ) : null}
            {sec.subtitle ? (
              <p className="text-aurora-muted text-sm">{sec.subtitle}</p>
            ) : null}
            {sec.body?.trim() ? (
              <p
                {...(withHolmesMarkers ? { "data-holmes-home-section-body": true } : {})}
                className="text-aurora-text text-sm leading-relaxed whitespace-pre-wrap"
              >
                {sec.body.trim()}
              </p>
            ) : null}
            {href ? (
              <div>
                <Link
                  {...(withHolmesMarkers ? { "data-holmes-home-section-link": true } : {})}
                  href={href}
                  className="inline-flex text-aurora-primary font-semibold text-sm hover:underline"
                >
                  {label} →
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </SectionShell>
    );
  }

  const isHalf = sec.layoutWidth === "half";

  return (
    <SectionShell
      withHolmesMarkers={withHolmesMarkers}
      className="mb-10 last:mb-0 rounded-2xl bg-aurora-surface border border-aurora-border/80 shadow-sm overflow-hidden ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
    >
      <div
        className="h-1 w-full bg-gradient-to-r from-aurora-primary/85 via-teal-500/55 to-aurora-primary/35"
        aria-hidden
      />
      {sec.imageUrl ? (
        <div className="mx-4 mt-4 rounded-xl overflow-hidden border border-aurora-border/60 aspect-video max-h-52 shadow-inner">
          <ProductImage
            src={sec.imageUrl}
            className="w-full h-full object-cover"
            thumbnail
            fallback={<div className="w-full h-full bg-aurora-surface-hover" />}
          />
        </div>
      ) : null}
      <div className={`p-5 sm:p-6 ${isHalf ? "" : "sm:px-8"}`}>
        <div
          className={
            isHalf
              ? "space-y-3"
              : "max-w-prose mx-auto space-y-4 text-center sm:text-left"
          }
        >
          <div className="flex gap-3 sm:gap-4 items-start">
            <div
              className="flex shrink-0 rounded-xl bg-gradient-to-br from-aurora-primary/14 to-aurora-primary/5 p-2 sm:p-2.5 text-aurora-primary ring-1 ring-aurora-primary/20 shadow-sm"
              aria-hidden
            >
              <ShoppingBasket className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1 space-y-2 sm:space-y-2.5">
              {title ? (
                <h2
                  {...(withHolmesMarkers ? { "data-holmes-home-section-title": true } : {})}
                  className="text-lg sm:text-xl font-bold text-aurora-text leading-snug tracking-tight"
                >
                  {title}
                </h2>
              ) : null}
              {sec.subtitle ? (
                <p className="text-aurora-muted text-sm leading-relaxed">{sec.subtitle}</p>
              ) : null}
              {sec.body?.trim() ? (
                <p
                  {...(withHolmesMarkers ? { "data-holmes-home-section-body": true } : {})}
                  className="text-aurora-text text-sm sm:text-[0.9375rem] leading-relaxed whitespace-pre-wrap"
                >
                  {sec.body.trim()}
                </p>
              ) : null}
            </div>
          </div>
          {href ? (
            <div
              className={
                isHalf
                  ? "pt-1 pl-[3.25rem] sm:pl-[3.5rem]"
                  : "pt-2 flex justify-center sm:justify-start sm:pl-[3.5rem]"
              }
            >
              <Link
                {...(withHolmesMarkers ? { "data-holmes-home-section-link": true } : {})}
                href={href}
                className="inline-flex items-center gap-1.5 rounded-full bg-aurora-primary/12 px-4 py-2.5 text-sm font-semibold text-aurora-primary ring-1 ring-aurora-primary/15 hover:bg-aurora-primary/18 hover:ring-aurora-primary/25 transition-colors"
              >
                {label}
                <span aria-hidden>→</span>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </SectionShell>
  );
}

export {
  ContentBlockProductCard,
  CONTENT_BLOCK_CARD_FOOTER_BAND,
  CONTENT_BLOCK_CARD_SHELL,
  CONTENT_BLOCK_IMAGE_WELL,
};

export function ProductGridSection({
  sec,
  symbol,
  withHolmesMarkers = true,
}: {
  sec: StoreContentSection;
  symbol: string;
  withHolmesMarkers?: boolean;
}) {
  if (!sec.products?.length) return null;
  const headerLink = sec.linkHref?.trim();
  return (
    <SectionShell withHolmesMarkers={withHolmesMarkers} className="mb-10 last:mb-0">
      <div className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <h2
            {...(withHolmesMarkers ? { "data-holmes-home-section-title": true } : {})}
            className="text-xl font-bold tracking-tight text-aurora-text sm:text-2xl"
          >
            {sec.title}
          </h2>
          {sec.subtitle ? (
            <p className="max-w-2xl text-sm leading-relaxed text-aurora-muted">
              {sec.subtitle}
            </p>
          ) : null}
          {sec.body?.trim() ? (
            <p className="max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-aurora-muted">
              {sec.body.trim()}
            </p>
          ) : null}
        </div>
        {headerLink ? (
          <Link
            href={headerLink}
            className="inline-flex shrink-0 items-center gap-1 self-start text-sm font-semibold text-aurora-primary hover:text-aurora-primary-dark hover:underline sm:self-auto"
          >
            {(sec.linkLabel || "View all products").trim()}
            <span aria-hidden>→</span>
          </Link>
        ) : null}
      </div>
      <div
        {...(withHolmesMarkers ? { "data-holmes-home-section-grid": true } : {})}
        className="grid grid-cols-2 items-start gap-4 sm:grid-cols-4 sm:gap-5"
      >
        {sec.products.map((prod) => (
          <ContentBlockProductCard
            key={prod.id}
            prod={prod}
            symbol={symbol}
            withHolmesMarkers={withHolmesMarkers}
          />
        ))}
      </div>
    </SectionShell>
  );
}

export function InspirationSection({
  sec,
  withHolmesMarkers = true,
}: {
  sec: StoreContentSection;
  withHolmesMarkers?: boolean;
}) {
  if (!sec.cards?.length) return null;
  return (
    <SectionShell withHolmesMarkers={withHolmesMarkers} className="mb-10 last:mb-0">
      <h2
        {...(withHolmesMarkers ? { "data-holmes-home-section-title": true } : {})}
        className="text-xl font-bold mb-4 flex items-center gap-2"
      >
        {sec.title}
      </h2>
      {sec.subtitle ? (
        <p className="text-aurora-muted text-sm mb-4">{sec.subtitle}</p>
      ) : null}
      <div
        {...(withHolmesMarkers ? { "data-holmes-home-section-grid": true } : {})}
        className="grid grid-cols-2 items-start gap-4 sm:grid-cols-4 sm:gap-5"
      >
        {sec.cards.map((card, j) => (
          <Link
            key={j}
            href={card.linkUrl || "/catalogue"}
            {...(withHolmesMarkers ? { "data-holmes-home-card": true } : {})}
            className={`flex flex-col overflow-hidden rounded-xl bg-white ${CONTENT_BLOCK_CARD_SHELL}`}
          >
            <div
              {...(withHolmesMarkers ? { "data-holmes-home-card-image": true } : {})}
              className={CONTENT_BLOCK_IMAGE_WELL}
            >
              <ProductImage
                src={card.imageUrl}
                className="absolute inset-0 h-full w-full"
                objectFit="contain"
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
    </SectionShell>
  );
}

export function RecipeIdeasRail({
  recipesWithProducts,
  withHolmesMarkers = true,
}: {
  recipesWithProducts: RecipeWithProducts[];
  withHolmesMarkers?: boolean;
}) {
  if (recipesWithProducts.length === 0) return null;
  return (
    <section
      {...(withHolmesMarkers ? { "data-holmes-home-section": true } : {})}
      className="mb-10 last:mb-0"
    >
      <h2
        {...(withHolmesMarkers ? { "data-holmes-home-section-title": true } : {})}
        className="text-xl font-bold mb-4 flex items-center gap-2"
      >
        <ChefHat className="w-6 h-6 text-aurora-primary" />
        Recipe ideas
      </h2>
      <div
        {...(withHolmesMarkers ? { "data-holmes-home-section-grid": true } : {})}
        className="grid grid-cols-2 items-start gap-4 sm:grid-cols-4 sm:gap-5"
      >
        {recipesWithProducts.map((r) => (
          <Link
            key={r.id}
            href={`/recipes/${encodeURIComponent(r.slug)}`}
            {...(withHolmesMarkers ? { "data-holmes-home-card": true } : {})}
            className={`flex flex-col overflow-hidden rounded-xl bg-white ${CONTENT_BLOCK_CARD_SHELL}`}
          >
            <div
              {...(withHolmesMarkers ? { "data-holmes-home-card-image": true } : {})}
              className={CONTENT_BLOCK_IMAGE_WELL}
            >
              <RecipeProductCollage
                imageUrls={r.productImageUrls ?? []}
                className="absolute inset-0 h-full w-full"
              />
            </div>
            <div className={CONTENT_BLOCK_CARD_FOOTER_BAND}>
              <p className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900">
                {r.title}
              </p>
              {r.description ? (
                <p className="mt-1 line-clamp-2 text-xs leading-snug text-stone-600">
                  {r.description}
                </p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function renderContentBlockSection(
  sec: StoreContentSection,
  symbol: string,
  recipesWithProducts: RecipeWithProducts[],
  key: string,
  withHolmesMarkers = true
): ReactNode {
  if (sec.type === "meals" && recipesWithProducts.length > 0) {
    return null;
  }

  if (sec.type === "inspiration") {
    return (
      <InspirationSection key={key} sec={sec} withHolmesMarkers={withHolmesMarkers} />
    );
  }

  if (sec.blockKind === "blurb" || sec.blockKind === "image_blurb") {
    return <BlurbBlock key={key} sec={sec} withHolmesMarkers={withHolmesMarkers} />;
  }

  if (
    sec.products &&
    sec.products.length > 0 &&
    (sec.type === "featured" ||
      sec.type === "top_up" ||
      sec.type === "for_you" ||
      sec.type === "meals")
  ) {
    return (
      <ProductGridSection
        key={key}
        sec={sec}
        symbol={symbol}
        withHolmesMarkers={withHolmesMarkers}
      />
    );
  }

  if (sec.type === "promo" && !sec.products?.length && !sec.cards?.length) {
    return <BlurbBlock key={key} sec={sec} withHolmesMarkers={withHolmesMarkers} />;
  }

  return null;
}

export function groupHalfWidthSections(
  sections: StoreContentSection[]
): Array<
  | { mode: "full"; sec: StoreContentSection }
  | { mode: "pair"; secs: StoreContentSection[] }
> {
  const out: Array<
    | { mode: "full"; sec: StoreContentSection }
    | { mode: "pair"; secs: StoreContentSection[] }
  > = [];
  let i = 0;
  while (i < sections.length) {
    const sec = sections[i];
    const next = sections[i + 1];
    if (sec.layoutWidth === "half" && next?.layoutWidth === "half") {
      out.push({ mode: "pair", secs: [sec, next] });
      i += 2;
    } else {
      out.push({ mode: "full", sec });
      i += 1;
    }
  }
  return out;
}

/** Renders grouped half-width rows + full-width blocks (SSR or client). */
export function GroupedStoreContentSections({
  sections,
  symbol,
  recipesWithProducts = [],
  withHolmesMarkers = false,
  className = "",
  pairGridClassName = "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 last:mb-0",
}: {
  sections: StoreContentSection[];
  symbol: string;
  recipesWithProducts?: RecipeWithProducts[];
  withHolmesMarkers?: boolean;
  className?: string;
  pairGridClassName?: string;
}): ReactNode {
  if (sections.length === 0) return null;
  const grouped = groupHalfWidthSections(sections);
  return (
    <div className={className}>
      {grouped.map((g, gi) => {
        if (g.mode === "pair") {
          return (
            <div key={`pair-${gi}`} className={pairGridClassName}>
              {g.secs.map((sec, si) =>
                renderContentBlockSection(
                  sec,
                  symbol,
                  recipesWithProducts,
                  `p-${gi}-${si}`,
                  withHolmesMarkers
                )
              )}
            </div>
          );
        }
        return renderContentBlockSection(
          g.sec,
          symbol,
          recipesWithProducts,
          `f-${gi}`,
          withHolmesMarkers
        );
      })}
    </div>
  );
}
