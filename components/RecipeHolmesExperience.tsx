"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@aurora-studio/starter-core";
import { ChefHat, ShoppingBasket, ArrowRight, Search } from "lucide-react";
import type { HolmesNextStepWire } from "./HolmesNextStepsStrip";
import { CONTENT_BLOCK_PANEL_SHELL } from "@/components/ContentBlockProductCard";

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "with",
  "and",
  "for",
  "your",
  "our",
  "this",
  "from",
  "recipe",
  "easy",
  "quick",
]);

function searchChipsFromRecipe(title: string, ingredients: Array<{ name: string }>): string[] {
  const fromTitle = title
    .replace(/[^\w\s'-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOPWORDS.has(w.toLowerCase()));
  const fromIng = ingredients
    .slice(0, 6)
    .map((i) => {
      const first = String(i.name || "")
        .replace(/\([^)]*\)/g, "")
        .trim()
        .split(/\s+/)[0];
      return first && first.length > 1 ? first : null;
    })
    .filter((x): x is string => Boolean(x));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of [...fromTitle, ...fromIng]) {
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
    if (out.length >= 10) break;
  }
  return out;
}

type ContextualHint = {
  hint?: string | null;
  products?: Array<{ id?: string; recordId?: string; name?: string; image_url?: string }>;
};

/**
 * Recipe PDP “WOW” layer: mission-aware strip, shop-the-recipe search chips,
 * contextual hint + products when Holmes session is live.
 */
function getHolmesSid(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.holmes?.getSessionId?.() ?? null;
  } catch {
    return null;
  }
}

function hrefForNextStep(route: string, pathname: string): string {
  const r = route || "/";
  if (r === "/catalogue/[id]") {
    const m = pathname.match(/\/catalogue\/([^/]+)/);
    if (m?.[1]) return `/catalogue/${m[1]}`;
    return "/catalogue";
  }
  return r;
}

export function RecipeHolmesExperience({
  recipeTitle,
  ingredients,
}: {
  recipeTitle: string;
  recipeSlug?: string;
  ingredients: Array<{ name: string }>;
}) {
  const pathname = usePathname() ?? "/";
  const { items } = useCart();
  const [mission, setMission] = useState<{
    key?: string;
    summary?: string;
    confidence?: number;
  } | null>(null);
  const [nextSteps, setNextSteps] = useState<HolmesNextStepWire[]>([]);
  const [contextual, setContextual] = useState<ContextualHint | null>(null);

  const chips = useMemo(
    () => searchChipsFromRecipe(recipeTitle, ingredients),
    [recipeTitle, ingredients]
  );

  const applyInfer = useCallback((detail: { candidates?: HolmesNextStepWire[]; mission?: unknown }) => {
    const m = detail.mission as { key?: string; summary?: string; confidence?: number } | null;
    if (m && typeof m === "object") setMission(m);
    const c = detail.candidates;
    if (c && Array.isArray(c) && c.length > 0) setNextSteps(c.slice(0, 5));
  }, []);

  useEffect(() => {
    function onNext(e: Event) {
      const ce = e as CustomEvent<{ candidates?: HolmesNextStepWire[]; mission?: unknown }>;
      applyInfer({ candidates: ce.detail?.candidates, mission: ce.detail?.mission ?? null });
    }
    function onInfer(e: Event) {
      const ce = e as CustomEvent<{ candidates?: HolmesNextStepWire[]; mission?: unknown }>;
      applyInfer({ candidates: ce.detail?.candidates ?? undefined, mission: ce.detail?.mission ?? null });
    }
    document.addEventListener("holmes:nextSteps", onNext);
    document.addEventListener("holmes:inferApplied", onInfer as EventListener);
    return () => {
      document.removeEventListener("holmes:nextSteps", onNext);
      document.removeEventListener("holmes:inferApplied", onInfer as EventListener);
    };
  }, [applyInfer]);

  useEffect(() => {
    let cancelled = false;
    const sid = getHolmesSid();
    if (!sid) {
      setContextual(null);
      return;
    }
    const cartNames = items.map((i) => i.name).filter(Boolean).join(",");
    const cartIds = items.map((i) => i.recordId).filter(Boolean).join(",");
    const qs = new URLSearchParams();
    qs.set("sid", sid);
    if (cartNames) qs.set("cart_names", cartNames);
    if (cartIds) qs.set("cart_ids", cartIds);
    (async () => {
      try {
        const res = await fetch(`/api/holmes/contextual-hint?${qs.toString()}`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as ContextualHint;
        if (!cancelled) setContextual(data);
      } catch {
        if (!cancelled) setContextual(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const conf = mission?.confidence ?? 0;
  const showMission = mission && conf >= 0.45 && mission.summary;
  const hintLine = contextual?.hint?.trim();

  return (
    <section
      className={`rounded-[1.25rem] bg-white/88 backdrop-blur-sm dark:bg-aurora-surface/85 p-5 sm:p-6 ${CONTENT_BLOCK_PANEL_SHELL}`}
      aria-label="Personalised for your shop"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-aurora-primary/12 text-aurora-primary ring-1 ring-aurora-primary/15">
              <ChefHat className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-aurora-muted">
                We curate this recipe for you
              </p>
              <p className="mt-1 max-w-xl text-sm leading-snug text-aurora-muted">
                We observe how you browse and what’s in your basket, and we adapt to you. We surface
                helpful routes and shortcuts from this page. Nothing extra to set up.
              </p>
            </div>
          </div>
          {showMission ? (
            <div className="max-w-xs rounded-xl border border-aurora-border/45 bg-[color-mix(in_srgb,var(--aurora-bg)_14%,white)] px-3 py-2.5 text-right shadow-[inset_0_1px_0_0_rgba(0,0,0,0.04)] dark:border-aurora-border/35 dark:bg-white/[0.05] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <p className="text-[10px] font-medium uppercase tracking-wider text-aurora-muted">
                Detected intent
              </p>
              <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-stone-900 dark:text-aurora-text">
                {mission!.summary}
              </p>
              <p className="mt-1 text-[10px] text-aurora-muted">
                {Math.round(conf * 100)}% confidence
                {mission!.key ? ` · ${mission!.key}` : ""}
              </p>
            </div>
          ) : null}
        </div>

        {chips.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-aurora-muted">
              <Search className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
              Shop ingredients &amp; ideas
            </p>
            <div className="flex flex-wrap gap-2">
              {chips.map((term) => (
                <Link
                  key={term}
                  href={`/catalogue?q=${encodeURIComponent(term)}`}
                  className="inline-flex items-center rounded-full border border-stone-200/90 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 shadow-sm shadow-stone-900/[0.03] transition-[border-color,background-color] duration-luxury ease-concierge hover:border-aurora-primary/25 hover:bg-aurora-primary/[0.06] dark:border-aurora-border/50 dark:bg-aurora-surface dark:text-aurora-text dark:hover:border-aurora-primary/30 dark:hover:bg-aurora-primary/10"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        )}

        {hintLine ? (
          <div className="rounded-xl border border-aurora-border/45 bg-[color-mix(in_srgb,var(--aurora-bg)_12%,white)] px-4 py-3 dark:bg-white/[0.04]">
            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-aurora-muted">
              <ShoppingBasket className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
              Because of your basket
            </p>
            <p className="text-sm text-aurora-text">{hintLine}</p>
            {contextual?.products && contextual.products.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {contextual.products.slice(0, 4).map((p, i) => {
                  const id = (p.recordId ?? p.id) as string | undefined;
                  if (!id) return null;
                  return (
                    <li key={`${id}-${i}`}>
                      <Link
                        href={`/catalogue/${id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-aurora-primary hover:text-aurora-primary-dark hover:underline"
                      >
                        {p.name ?? "Product"} <ArrowRight className="h-3 w-3" aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}

        {nextSteps.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-aurora-muted">
              Likely next steps
            </p>
            <div className="flex flex-wrap gap-2">
              {nextSteps.map((c, i) => (
                <Link
                  key={`${c.route}-${c.fragmentType}-${i}`}
                  href={hrefForNextStep(c.route, pathname)}
                  className={
                    c.kind === "suggestion"
                      ? "inline-flex items-center rounded-full border border-aurora-border/55 bg-stone-100/90 px-3 py-1 text-xs font-medium text-stone-800 transition-colors hover:bg-stone-200/90 dark:border-aurora-border/45 dark:bg-white/[0.06] dark:text-aurora-text dark:hover:bg-white/[0.1]"
                      : "inline-flex items-center rounded-full border border-aurora-primary/22 bg-aurora-primary/10 px-3 py-1 text-xs font-semibold text-aurora-primary transition-colors hover:bg-aurora-primary/16"
                  }
                >
                  {c.intentLabel ?? c.fragmentType}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
