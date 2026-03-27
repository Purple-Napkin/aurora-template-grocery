"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@aurora-studio/starter-core";
import { ChefHat, Sparkles, ShoppingBasket, ArrowRight, Search, Zap } from "lucide-react";
import type { HolmesNextStepWire } from "./HolmesNextStepsStrip";

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
      className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/30 via-aurora-surface to-violet-950/20 p-5 sm:p-6 shadow-[0_20px_60px_-24px_rgba(16,185,129,0.35)]"
      aria-label="Personalised for your shop"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30">
              <ChefHat className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200/90 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Holmes for this recipe
              </p>
              <p className="mt-1 text-sm text-aurora-muted leading-snug max-w-xl">
                We use your session, basket, and this page to preload routes and surface smarter
                shortcuts—no extra taps to “train” the shop.
              </p>
            </div>
          </div>
          {showMission ? (
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-right max-w-xs">
              <p className="text-[10px] uppercase tracking-wider text-aurora-muted">Detected intent</p>
              <p className="text-sm font-medium text-aurora-text line-clamp-2">{mission!.summary}</p>
              <p className="text-[10px] text-aurora-muted mt-0.5">
                {Math.round(conf * 100)}% confidence
                {mission!.key ? ` · ${mission!.key}` : ""}
              </p>
            </div>
          ) : null}
        </div>

        {chips.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-aurora-muted uppercase tracking-wider mb-2 flex items-center gap-2">
              <Search className="h-3.5 w-3.5" aria-hidden />
              Shop ingredients &amp; ideas
            </p>
            <div className="flex flex-wrap gap-2">
              {chips.map((term) => (
                <Link
                  key={term}
                  href={`/catalogue?q=${encodeURIComponent(term)}`}
                  className="inline-flex items-center rounded-full border border-aurora-border/80 bg-aurora-surface/80 px-3 py-1.5 text-xs font-medium text-aurora-text hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        )}

        {hintLine ? (
          <div className="rounded-xl border border-aurora-border/60 bg-aurora-surface/50 px-4 py-3">
            <p className="text-xs font-semibold text-aurora-muted uppercase tracking-wider mb-1 flex items-center gap-2">
              <ShoppingBasket className="h-3.5 w-3.5" aria-hidden />
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
                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-300 hover:underline"
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
            <p className="text-xs font-semibold text-aurora-muted uppercase tracking-wider mb-2 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-400/90" aria-hidden />
              Likely next steps
            </p>
            <div className="flex flex-wrap gap-2">
              {nextSteps.map((c, i) => (
                <Link
                  key={`${c.route}-${c.fragmentType}-${i}`}
                  href={hrefForNextStep(c.route, pathname)}
                  className={
                    c.kind === "suggestion"
                      ? "inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100 hover:bg-amber-500/20"
                      : "inline-flex items-center rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100 hover:bg-emerald-500/18"
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
