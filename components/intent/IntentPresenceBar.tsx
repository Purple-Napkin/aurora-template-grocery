"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { X, RotateCcw, Info } from "lucide-react";
import { useMissionAware } from "@/components/MissionAwareHome";
import { useCart } from "@aurora-studio/starter-core";
import { getRecipeTitle } from "@/lib/cart-intelligence";
import {
  MISSION_BAR_DISMISS_KEY,
  isMissionBarDismissed,
} from "@/lib/mission-bar";
import { holmesFullSessionReset } from "@aurora-studio/starter-core";
import {
  alignedMissionTrustLine,
  isCookingMissionKey,
  isTravelLikeMission,
} from "@/lib/intent-mission";

function setDismissed(value: boolean) {
  try {
    if (value) sessionStorage.setItem(MISSION_BAR_DISMISS_KEY, "1");
    else sessionStorage.removeItem(MISSION_BAR_DISMISS_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * High-confidence intent: full-width bar under nav ("Cook dinner mode active").
 */
export function IntentPresenceBar() {
  const missionData = useMissionAware();
  const { items } = useCart();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dismissed, setDismissedState] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const whyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDismissedState(isMissionBarDismissed());
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (whyRef.current && !whyRef.current.contains(e.target as Node)) setWhyOpen(false);
    };
    if (whyOpen) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [whyOpen]);

  const activeMission = missionData?.activeMission;
  const catalogueRecipeSearch =
    pathname === "/catalogue" && Boolean(getRecipeTitle(searchParams.get("q") ?? ""));

  const showBar =
    activeMission &&
    activeMission.band === "high" &&
    activeMission.uiHints?.showMissionBar !== false &&
    !dismissed &&
    !catalogueRecipeSearch;

  if (!showBar) return null;

  const summary = alignedMissionTrustLine(
    activeMission.key,
    activeMission.label,
    activeMission.summary,
    items.length > 0
  );

  const whyExplanation =
    activeMission.whyDetail?.trim() ||
    summary ||
    "We combine your basket, searches, and browsing to pick this mode.";

  const missionCta = () => {
    if (isTravelLikeMission(activeMission.key)) {
      return { href: "/catalogue?q=travel+essentials", label: "Shop travel essentials" };
    }
    if (isCookingMissionKey(activeMission.key)) {
      return { href: "/cart", label: "Complete your basket" };
    }
    return { href: "/catalogue", label: "Continue shopping" };
  };

  const cta = missionCta();

  /** Subline is the main “ideas” CTA for meal/cooking missions (API copy often reads like “Here are ideas for your meal”). */
  const summaryHref = isCookingMissionKey(activeMission.key)
    ? "/for-you/recipes"
    : isTravelLikeMission(activeMission.key)
      ? "/catalogue?q=travel+essentials"
      : null;

  const summaryClassName =
    "text-xs sm:text-sm text-emerald-200/80 mt-0.5 line-clamp-2 block";

  const handleDismiss = () => {
    setDismissed(true);
    setDismissedState(true);
    window.dispatchEvent(new CustomEvent("holmes:missionBarDismissed"));
  };

  const handleReset = () => {
    setDismissed(false);
    setDismissedState(false);
    holmesFullSessionReset();
  };

  return (
    <div
      className="w-full border-b border-emerald-900/30 bg-[#14532d] text-emerald-50 shadow-sm"
      data-holmes="intent-presence-bar"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p
            className="text-sm sm:text-base font-semibold tracking-tight transition-opacity duration-150 ease-out motion-reduce:transition-none"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="text-emerald-200/90">Shop by mission · </span>
            {activeMission.label}
            <span className="font-normal text-emerald-100/85"> — mode active</span>
          </p>
          {summaryHref ? (
            <Link
              href={summaryHref}
              className={`${summaryClassName} font-medium text-emerald-100 underline decoration-emerald-200/70 underline-offset-2 hover:text-white hover:decoration-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 rounded-sm`}
            >
              {summary}
            </Link>
          ) : (
            <p className={summaryClassName}>{summary}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="relative" ref={whyRef}>
            <button
              type="button"
              onClick={() => setWhyOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-emerald-100 hover:bg-white/10 transition-colors"
            >
              <Info className="w-3.5 h-3.5 shrink-0" aria-hidden />
              Why am I seeing this?
            </button>
            {whyOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-[min(100vw-2rem,24rem)] rounded-xl border border-emerald-800 bg-[#0f3d24] p-3 text-xs text-emerald-100 shadow-xl whitespace-pre-line leading-relaxed">
                {whyExplanation}
              </div>
            )}
          </div>
          <Link
            href={cta.href}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-white text-[#14532d] hover:bg-emerald-50 transition-colors"
          >
            {cta.label}
          </Link>
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-lg text-emerald-200 hover:bg-white/10 transition-colors"
            aria-label="Reset Holmes session — clears basket and browsing state, then reloads"
            title="Reset Holmes session — clears basket, session data, and starts a fresh Holmes session (reloads)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-2 rounded-lg text-emerald-200 hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
