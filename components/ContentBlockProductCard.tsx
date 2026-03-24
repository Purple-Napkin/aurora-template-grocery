"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ProductImage,
  ProductSaleBadge,
  getThumbnailImageUrl,
  resolveProductImageUrl,
  useStoreConfigImageBase,
  formatPrice,
  toCents,
  getStoreConfig,
  AddToCartButton,
} from "@aurora-studio/starter-core";

export type ContentBlockProduct = {
  id: string;
  name: string;
  price?: number;
  image_url?: string;
  /** From `catalog_product_listing` when the tenant view is provisioned */
  description?: string;
  category?: string;
  category_slug?: string;
  on_sale?: boolean;
};

/**
 * `split` = stone-toned meta on white. `radial` = cutout PNG path + aurora-toned meta.
 * Image well: white, top-bleed band with `object-cover` from the top (see `CONTENT_BLOCK_IMAGE_WELL`).
 */
type CardLayoutMode = "radial" | "split";

/**
 * Initial layout before probe: always **split** (opaque packshot). Probe may upgrade to **radial**
 * only when we see enough real transparency — avoids classifying opaque PNGs (or antialiased edges) as radial.
 */
function guessLayoutFromUrl(_src: string | null | undefined): CardLayoutMode {
  return "split";
}

/**
 * Canvas probe:
 * - Meaningful transparency → **radial** (meta styling tuned for cutouts).
 * - Otherwise → **split** (cream band meta).
 */
function probeImageLayout(absoluteUrl: string): Promise<CardLayoutMode> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const done = (m: CardLayoutMode) => {
      clearTimeout(tid);
      resolve(m);
    };
    const tid = setTimeout(() => done("split"), 4000);
    img.onload = () => {
      try {
        const sw = 48;
        const sh = 48;
        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          done("split");
          return;
        }
        ctx.drawImage(img, 0, 0, sw, sh);
        const { data } = ctx.getImageData(0, 0, sw, sh);
        const total = sw * sh;
        /** Near-opaque antialias on packshots often sits in 240–254; real holes are much lower. */
        let strongTransparent = 0;
        let softTransparent = 0;
        for (let y = 0; y < sh; y++) {
          for (let x = 0; x < sw; x++) {
            const i = (y * sw + x) * 4;
            const a = data[i + 3]!;
            if (a < 28) strongTransparent++;
            if (a < 235) softTransparent++;
          }
        }
        const minStrong = Math.max(40, Math.floor(total * 0.004));
        const minSoftRatio = 0.11;
        const looksCutout =
          strongTransparent >= minStrong ||
          softTransparent / total >= minSoftRatio;
        done(looksCutout ? "radial" : "split");
      } catch {
        done("split");
      }
    };
    img.onerror = () => done("split");
    img.src = absoluteUrl;
  });
}

const cardShell =
  "border border-aurora-border/55 shadow-sm shadow-black/[0.04] transition-[box-shadow,border-color] duration-200 ease-out hover:border-aurora-primary/22 hover:shadow-md hover:shadow-black/[0.06] dark:border-aurora-border/40 dark:shadow-none dark:ring-1 dark:ring-inset dark:ring-white/[0.06] dark:hover:shadow-lg dark:hover:shadow-black/35";

/** Shared chrome for product grid + adaptive/inspiration link cards (split-style). */
export const CONTENT_BLOCK_CARD_SHELL = cardShell;

/** Top image band: full card width, rounded with card via `overflow-hidden`; images use `object-cover` + top anchor. */
export const CONTENT_BLOCK_IMAGE_WELL =
  "relative isolate block aspect-[5/3] w-full shrink-0 overflow-hidden bg-white dark:bg-white [&_img]:!object-top";

/** Bottom band matching split `ContentBlockProductCard` meta area. */
export const CONTENT_BLOCK_CARD_FOOTER_BAND =
  "border-t border-stone-200/90 bg-white dark:bg-white p-3 sm:p-4";

function relatedSearchQuery(prod: ContentBlockProduct): string {
  const fromCat = prod.category?.trim().split(/\s+/)[0];
  if (fromCat) return fromCat;
  return prod.name.trim().split(/\s+/).slice(0, 2).join(" ");
}

function TitlePrice({
  prod,
  currency = "GBP",
  titleClassName = "text-aurora-text",
}: {
  prod: ContentBlockProduct;
  /** ISO 4217 — same as PDP / cart (`formatPrice` + `toCents`). */
  currency?: string;
  titleClassName?: string;
}) {
  const cents = prod.price != null ? toCents(Number(prod.price)) : undefined;
  const showPrice = cents != null && cents > 0;
  return (
    <>
      <p
        className={`line-clamp-2 min-h-[2.375rem] text-sm font-semibold leading-snug tracking-tight sm:text-base ${titleClassName}`}
      >
        {prod.name}
      </p>
      <div className="mt-1 min-h-[1.25rem]">
        {showPrice ? (
          <p className="text-sm font-bold tabular-nums text-aurora-primary">
            {formatPrice(cents, currency)}
          </p>
        ) : null}
      </div>
    </>
  );
}

function CardMeta({
  prod,
  variant,
}: {
  prod: ContentBlockProduct;
  variant: "split" | "radial";
}) {
  const muted =
    variant === "split" ? "text-stone-600" : "text-aurora-muted";
  const linkCls =
    variant === "split"
      ? "font-semibold text-stone-800 hover:text-stone-950 hover:underline"
      : "font-semibold text-aurora-primary hover:underline";
  const pillCls =
    variant === "split"
      ? "inline-flex max-w-full rounded-full bg-stone-200/70 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-stone-800 ring-1 ring-stone-300/50"
      : "inline-flex max-w-full rounded-full bg-aurora-primary/12 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-aurora-primary ring-1 ring-aurora-primary/25";

  const desc = prod.description?.trim();
  const cat = prod.category?.trim();
  const slug = prod.category_slug?.trim();
  const q = relatedSearchQuery(prod);

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {cat ? (
        slug ? (
          <Link
            href={`/catalogue?category=${encodeURIComponent(slug)}`}
            className={pillCls}
          >
            <span className="truncate">{cat}</span>
          </Link>
        ) : (
          <span className={pillCls}>
            <span className="truncate">{cat}</span>
          </span>
        )
      ) : null}
      {desc ? (
        <p className={`line-clamp-2 text-[0.6875rem] leading-snug ${muted}`}>
          {desc}
        </p>
      ) : null}
      <div
        className={`flex flex-wrap items-center gap-x-1.5 gap-y-0.5 border-t pt-1.5 text-[0.6875rem] leading-tight ${variant === "split" ? "border-stone-200/70" : "border-aurora-border/45"}`}
      >
        <Link href="/for-you/recipes" className={linkCls}>
          Used in recipes
        </Link>
        <span className={muted} aria-hidden>
          ·
        </span>
        <Link href={`/catalogue?q=${encodeURIComponent(q)}`} className={linkCls}>
          Related products
        </Link>
      </div>
    </div>
  );
}

function AddToCartRow({
  prod,
  resolvedImageUrl,
}: {
  prod: ContentBlockProduct;
  resolvedImageUrl: string | null;
}) {
  const [tableSlug, setTableSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStoreConfig()
      .then((c) => {
        if (cancelled) return;
        const slug = (c as { catalogTableSlug?: string })?.catalogTableSlug?.trim();
        setTableSlug(slug && c?.enabled ? slug : null);
      })
      .catch(() => {
        if (!cancelled) setTableSlug(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cents = prod.price != null ? toCents(Number(prod.price)) : undefined;
  if (!tableSlug || cents == null || cents <= 0) return null;

  return (
    <div className="mt-3 border-t border-stone-200/70 pt-3 dark:border-aurora-border/45">
      <AddToCartButton
        recordId={prod.id}
        tableSlug={tableSlug}
        name={prod.name}
        unitAmount={cents}
        imageUrl={resolvedImageUrl ?? prod.image_url ?? null}
        className="w-full h-11 rounded-xl bg-aurora-primary text-white text-sm font-semibold hover:bg-aurora-primary-dark transition-colors"
      />
    </div>
  );
}

export function ContentBlockProductCard({
  prod,
  currency = "GBP",
  withHolmesMarkers = true,
}: {
  prod: ContentBlockProduct;
  currency?: string;
  withHolmesMarkers?: boolean;
}) {
  const cardMarkers = withHolmesMarkers
    ? ({ "data-holmes-home-card": true } as const)
    : {};
  const imgMarkers = withHolmesMarkers
    ? ({ "data-holmes-home-card-image": true } as const)
    : {};

  const imageBase = useStoreConfigImageBase();
  const resolved = useMemo(() => {
    const base = imageBase ?? process.env.NEXT_PUBLIC_APP_URL ?? null;
    let r = resolveProductImageUrl(prod.image_url, base);
    if (r) r = getThumbnailImageUrl(r) ?? r;
    return r;
  }, [prod.image_url, imageBase]);

  const [layout, setLayout] = useState<CardLayoutMode>(() =>
    guessLayoutFromUrl(prod.image_url)
  );

  useEffect(() => {
    setLayout(guessLayoutFromUrl(prod.image_url));
    if (!resolved) return;
    let cancelled = false;
    probeImageLayout(resolved).then((m) => {
      if (!cancelled) setLayout(m);
    });
    return () => {
      cancelled = true;
    };
  }, [resolved, prod.image_url]);

  const imgShared = {
    src: prod.image_url,
    alt: prod.name,
    baseUrl: process.env.NEXT_PUBLIC_APP_URL,
    objectFit: "cover" as const,
    thumbnail: true as const,
    fallback: (
      <span className="flex h-full min-h-[5rem] w-full items-center justify-center text-aurora-muted text-2xl font-light">
        —
      </span>
    ),
  };

  const pdp = `/catalogue/${prod.id}`;

  if (layout === "split") {
    return (
      <div
        {...cardMarkers}
        className={`group flex flex-col overflow-hidden rounded-xl bg-white dark:bg-white ${cardShell}`}
      >
        <Link href={pdp} {...imgMarkers} className={CONTENT_BLOCK_IMAGE_WELL}>
          {prod.on_sale ? <span className="sr-only">On sale. </span> : null}
          <ProductImage
            {...imgShared}
            className="absolute inset-0 h-full w-full transition-transform duration-200 ease-out group-hover:scale-[1.02]"
          />
          {prod.on_sale ? <ProductSaleBadge /> : null}
        </Link>
        <div className="flex flex-col border-t border-stone-200/90 bg-white dark:bg-white p-3 sm:p-4">
          <Link href={pdp} className="block min-w-0 text-stone-900">
            <TitlePrice prod={prod} currency={currency} titleClassName="text-stone-900" />
          </Link>
          <CardMeta prod={prod} variant="split" />
          <AddToCartRow prod={prod} resolvedImageUrl={resolved} />
        </div>
      </div>
    );
  }

  return (
    <div
      {...cardMarkers}
      className={`group flex flex-col overflow-hidden rounded-xl bg-white dark:bg-white ${cardShell}`}
    >
      <Link href={pdp} {...imgMarkers} className={CONTENT_BLOCK_IMAGE_WELL}>
        {prod.on_sale ? <span className="sr-only">On sale. </span> : null}
        <ProductImage
          {...imgShared}
          className="absolute inset-0 z-10 h-full w-full transition-transform duration-200 ease-out group-hover:scale-[1.02]"
        />
        {prod.on_sale ? <ProductSaleBadge /> : null}
      </Link>
      <div className="flex flex-col border-t border-stone-200/90 bg-white dark:bg-white p-3 sm:p-4">
        <Link href={pdp} className="block min-w-0">
          <TitlePrice prod={prod} currency={currency} />
        </Link>
        <CardMeta prod={prod} variant="radial" />
        <AddToCartRow prod={prod} resolvedImageUrl={resolved} />
      </div>
    </div>
  );
}
