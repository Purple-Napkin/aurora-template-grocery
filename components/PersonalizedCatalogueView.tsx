"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { search, getStoreConfig } from "@aurora-studio/starter-core";
import { useCart } from "@aurora-studio/starter-core";
import { useStore } from "@aurora-studio/starter-core";
import { useDietaryExclusions } from "@/components/DietaryExclusionsContext";
import { useMissionAware } from "@/components/MissionAwareHome";
import { MISSION_FOCUS_QUERY } from "@/lib/mission-catalogue-config";
import type { SearchHit } from "@aurora-studio/starter-core";
import {
  ProductImage,
  formatPrice,
  AddToCartButton,
  isRecordOnSale,
  ProductSaleBadge,
} from "@aurora-studio/starter-core";
/** Distinct tiles from the main catalogue grid; same CMS patterns, different layout. */

function getHolmesSid(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.holmes?.getSessionId?.() ?? null;
  } catch {
    return null;
  }
}

function dedupeHits(hits: SearchHit[]): SearchHit[] {
  const seen = new Set<string>();
  const out: SearchHit[] = [];
  for (const h of hits) {
    const id = String((h as SearchHit).recordId ?? (h as SearchHit).id ?? "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(h);
  }
  return out;
}

function getImageUrl(record: Record<string, unknown>): string | null {
  const url =
    (record as SearchHit).image_url ??
    record.image_url ??
    record.image ??
    record.thumbnail ??
    record.photo;
  return url ? String(url) : null;
}

function getPrice(record: Record<string, unknown>): number | undefined {
  const p = (record as SearchHit).price ?? record.price ?? record.amount ?? record.value;
  return p != null ? Number(p) : undefined;
}

function getDisplayName(record: Record<string, unknown>): string {
  const r = record as SearchHit;
  const fn = r.functional_name ?? record.functional_name;
  if (typeof fn === "string" && fn.trim()) return fn.trim();
  return String(r.name ?? r.title ?? r.snippet ?? record.id ?? "");
}

function titleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type Section = { id: string; title: string; subtitle?: string; hits: SearchHit[] };

/**
 * Alternate catalogue layout: mission-led sections, suggested aisles, goes-with basket.
 * Triggered by ?view=personalised (e.g. next-steps strip). `personalized` is accepted too.
 */
export function PersonalizedCatalogueView() {
  const { items } = useCart();
  const { store } = useStore();
  const { excludeDietary } = useDietaryExclusions();
  const missionData = useMissionAware();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogSlug, setCatalogSlug] = useState<string | null>(null);
  const [currency, setCurrency] = useState("GBP");

  const activeMission = missionData?.activeMission;
  const cartFingerprint = items.map((i) => i.recordId).join(",");

  useEffect(() => {
    (async () => {
      try {
        const config = await getStoreConfig();
        if (config?.catalogTableSlug) {
          setCatalogSlug(config.catalogTableSlug);
          setCurrency((config as { currency?: string }).currency ?? "GBP");
        }
      } catch {
        setCatalogSlug("products");
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const vendorId = store?.id;
    const dietary = excludeDietary.length ? excludeDietary : undefined;
    const sid = getHolmesSid();
    const next: Section[] = [];

    try {
      const missionKey = activeMission?.key ?? "";
      const fq = missionKey ? MISSION_FOCUS_QUERY[missionKey as keyof typeof MISSION_FOCUS_QUERY] : "";
      if (fq?.trim()) {
        const res = await search({
          q: fq.trim(),
          limit: 14,
          offset: 0,
          vendorId,
          excludeDietary: dietary,
        });
        const hits = dedupeHits((res.hits ?? []) as SearchHit[]);
        if (hits.length > 0) {
          next.push({
            id: "mission",
            title: "Starting with what fits your moment",
            subtitle: activeMission?.label,
            hits,
          });
        }
      }

      let suggested: string[] = [];
      if (sid) {
        const r = await fetch(`/api/category-suggestions?sid=${encodeURIComponent(sid)}`);
        const d = await r.json();
        if (Array.isArray(d?.suggested)) suggested = d.suggested.slice(0, 4);
      }
      for (const slug of suggested) {
        const res = await search({
          q: "",
          limit: 12,
          offset: 0,
          vendorId,
          category: slug,
          excludeDietary: dietary,
        });
        const hits = dedupeHits((res.hits ?? []) as SearchHit[]);
        if (hits.length < 4) continue;
        next.push({
          id: `cat-${slug}`,
          title: `From ${titleCaseSlug(slug)}`,
          subtitle: "We thought you might like these",
          hits,
        });
      }

      if (items.length > 0) {
        const first = items[0];
        const pid = first.recordId;
        const qs = new URLSearchParams({ product_id: pid, limit: "12" });
        if (dietary?.length) qs.set("excludeDietary", dietary.join(","));
        const gr = await fetch(`/api/holmes/goes-with?${qs.toString()}`);
        const gd = await gr.json();
        const raw = gd?.products as Record<string, unknown>[] | undefined;
        if (raw?.length) {
          const mapped = dedupeHits(
            raw
              .filter((p) => String(p.recordId ?? p.id) !== String(pid))
              .map((p) => ({
                ...p,
                recordId: p.recordId ?? p.id,
              })) as SearchHit[]
          );
          if (mapped.length > 0) {
            next.push({
              id: "goes-with",
              title: "Lovely beside what you’ve chosen",
              subtitle: `Next to ${first.name}`,
              hits: mapped,
            });
          }
        }
      }

      if (next.length === 0) {
        const res = await search({
          q: "groceries",
          limit: 28,
          offset: 0,
          vendorId,
          sort: "name",
          order: "asc",
          excludeDietary: dietary,
        });
        const hits = dedupeHits((res.hits ?? []) as SearchHit[]);
        if (hits.length > 0) {
          next.push({
            id: "fallback",
            title: "A few ideas to begin with",
            subtitle: "We’ll keep refining this as you look around.",
            hits,
          });
        }
      }
    } catch {
      /* keep empty */
    }

    setSections(next);
    setLoading(false);
  }, [store?.id, excludeDietary, activeMission?.key, activeMission?.label, cartFingerprint, items]);

  useEffect(() => {
    if (!store?.id) return;
    load();
  }, [store?.id, load]);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/catalogue"
          className="inline-flex items-center gap-2 rounded-full border border-stone-400/80 bg-white/90 px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm shadow-stone-900/5 hover:bg-white dark:border-stone-600 dark:bg-stone-900/80 dark:text-stone-100 dark:hover:bg-stone-900"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Shop full catalogue
        </Link>
        <p className="hidden text-sm font-medium text-stone-600 sm:block dark:text-stone-300">
          Glad you’re here
        </p>
      </div>

      <header className="relative overflow-hidden rounded-[1.75rem] border border-emerald-900/20 bg-gradient-to-br from-[#0f3d24] via-[#14532d] to-[#064e3b] p-7 text-emerald-50 shadow-[0_20px_50px_-24px_rgba(6,78,59,0.55)] sm:p-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 h-40 w-40 rounded-full bg-amber-200/10 blur-3xl" aria-hidden />
        <div className="relative flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/25 backdrop-blur-sm">
            <Sparkles className="h-7 w-7 text-emerald-200" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/95">
              Your aisle
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl">
              Welcome to your corner of the shop
            </h1>
            {activeMission?.label ? (
              <p className="mt-2 text-lg font-medium leading-snug text-emerald-50/95 sm:text-xl">
                {activeMission.label}
              </p>
            ) : null}
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-emerald-100/92 sm:text-[15px]">
              This space is yours. We notice what you’re in the mood for and gently shape what you
              see. You don’t need to work anything out. Stay as long as you like; we’re glad you’re
              here.
            </p>
          </div>
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-stone-600 dark:text-stone-400">Gathering a few things we think you’ll love…</p>
      ) : sections.length === 0 ? (
        <p className="text-sm text-stone-600 dark:text-stone-400">
          We’re still getting this corner ready for you.{" "}
          <Link
            href="/catalogue"
            className="font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            Explore the full shop
          </Link>
          {" "}whenever you like.
        </p>
      ) : (
        <div className="space-y-14">
          {sections.map((section, si) => (
            <section
              key={section.id}
              aria-labelledby={`pcat-${section.id}`}
              className="rounded-[1.5rem] border border-stone-300/70 bg-white/70 p-5 shadow-[0_24px_60px_-40px_rgba(20,83,45,0.35)] backdrop-blur-[2px] dark:border-stone-700/80 dark:bg-stone-900/50 sm:p-7"
            >
              <div className="mb-5 flex flex-wrap items-end gap-4 border-b border-stone-200/90 pb-4 dark:border-stone-700/80">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-900 text-sm font-bold text-emerald-50 dark:bg-emerald-700"
                  aria-hidden
                >
                  {String(si + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <h2
                    id={`pcat-${section.id}`}
                    className="font-display text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 sm:text-2xl"
                  >
                    {section.title}
                  </h2>
                  {section.subtitle ? (
                    <p className="mt-1 text-sm font-medium text-stone-600 dark:text-stone-400">
                      {section.subtitle}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Carousels only: distinct from the dense multi-column grid on /catalogue */}
              <div className="relative -mx-1">
                <div
                  className="flex gap-5 overflow-x-auto overflow-y-visible pb-3 pl-1 pr-1 pt-1 snap-x snap-mandatory scroll-smooth [scrollbar-width:thin]"
                  style={{
                    maskImage:
                      "linear-gradient(to right, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)",
                  }}
                >
                  {section.hits.map((record) => {
                    const id = String(
                      (record as SearchHit).recordId ?? (record as SearchHit).id ?? ""
                    );
                    const name = getDisplayName(record as Record<string, unknown>);
                    const rawPrice = getPrice(record as Record<string, unknown>);
                    const sellByWeight = Boolean((record as SearchHit).sell_by_weight);
                    const unit = ((record as SearchHit).unit as string) || "kg";
                    const pricePerUnit = (record as SearchHit).price_per_unit as number | undefined;
                    const priceCents =
                      sellByWeight && pricePerUnit != null
                        ? Math.round(pricePerUnit * 100)
                        : rawPrice != null
                          ? Math.round(rawPrice * 100)
                          : undefined;
                    const imageUrl = getImageUrl(record as Record<string, unknown>);
                    const onSale = isRecordOnSale(record as Record<string, unknown>);

                    return (
                      <div
                        key={`${section.id}-${id}`}
                        className="snap-start shrink-0 w-[10.75rem] sm:w-[12rem]"
                      >
                        <div className="group flex h-full flex-col overflow-hidden rounded-2xl bg-stone-50 ring-2 ring-emerald-900/10 shadow-[0_12px_40px_-18px_rgba(20,83,45,0.35)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(20,83,45,0.45)] dark:bg-stone-900/80 dark:ring-emerald-500/20">
                          <Link
                            href={`/catalogue/${id}`}
                            className="relative block aspect-[4/5] w-full overflow-hidden bg-stone-200/80 dark:bg-stone-800"
                          >
                            <ProductImage
                              src={imageUrl}
                              className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
                              objectFit="cover"
                              thumbnail
                              fallback={
                                <div className="flex h-full w-full items-center justify-center text-stone-400 text-3xl">
                                  -
                                </div>
                              }
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pt-6 pb-2 px-2.5">
                              <p className="line-clamp-2 text-sm font-semibold leading-snug text-white drop-shadow-sm">
                                {name}
                              </p>
                              {priceCents != null && (
                                <p className="mt-1 text-sm font-bold text-emerald-200">
                                  {sellByWeight && pricePerUnit != null
                                    ? formatPrice(Math.round(pricePerUnit * 100), currency) +
                                      `/${unit}`
                                    : formatPrice(priceCents, currency)}
                                </p>
                              )}
                            </div>
                            {onSale ? (
                              <span className="absolute left-2 top-2">
                                <ProductSaleBadge />
                              </span>
                            ) : null}
                          </Link>
                          <div className="flex flex-1 flex-col gap-2 border-t border-stone-200/90 bg-white px-2.5 py-3 dark:border-stone-700 dark:bg-stone-950/50">
                            {priceCents != null && catalogSlug ? (
                              <AddToCartButton
                                recordId={id}
                                tableSlug={catalogSlug}
                                name={name}
                                unitAmount={priceCents}
                                sellByWeight={sellByWeight}
                                unit={unit}
                                imageUrl={imageUrl}
                              />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
