"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { X, RotateCcw, Sparkles, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useMissionAware } from "./MissionAwareHome";
import { useCart } from "@aurora-studio/starter-core";
import { getRecipeTitle } from "@/lib/cart-intelligence";
import {
  MISSION_BAR_DISMISS_KEY,
  isMissionBarDismissed,
  isMissionBarCollapsed,
  setMissionBarCollapsed,
} from "@/lib/mission-bar";
import { holmesFullSessionReset } from "@aurora-studio/starter-core";
import {
  alignedMissionTrustLine,
  isCookingMissionKey,
  isTravelLikeMission,
} from "@/lib/intent-mission";

function setDismissed(value: boolean) {
  try {
    if (value) {
      sessionStorage.setItem(MISSION_BAR_DISMISS_KEY, "1");
    } else {
      sessionStorage.removeItem(MISSION_BAR_DISMISS_KEY);
    }
  } catch {
    /* ignore */
  }
}

/** Medium confidence only — high uses IntentPresenceBar; low uses IntentAssistancePanel on home. */
export function ActiveMissionBar() {
  const missionData = useMissionAware();
  const { items } = useCart();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dismissed, setDismissedState] = useState(false);
  const [collapsed, setCollapsedState] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const whyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDismissedState(isMissionBarDismissed());
    setCollapsedState(isMissionBarCollapsed());
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
    activeMission.band === "medium" &&
    activeMission.uiHints?.showMissionBar !== false &&
    !dismissed &&
    !catalogueRecipeSearch;

  const hasCartItems = items.length >= 1;

  if (!showBar) return null;

  const handleDismiss = () => {
    setDismissed(true);
    setDismissedState(true);
    window.dispatchEvent(new CustomEvent("holmes:missionBarDismissed"));
  };

  const handleCollapse = () => {
    setCollapsedState(true);
    setMissionBarCollapsed(true);
  };

  const handleExpand = () => {
    setCollapsedState(false);
    setMissionBarCollapsed(false);
  };

  const handleReset = () => {
    setDismissed(false);
    setDismissedState(false);
    holmesFullSessionReset();
  };

  const trustLine = alignedMissionTrustLine(
    activeMission.key,
    activeMission.label,
    activeMission.summary,
    hasCartItems
  );
  const headline =
    trustLine ||
    `Looks like you might be focused on: ${activeMission.label}`;

  const whyText =
    activeMission.whyDetail?.trim() ||
    trustLine ||
    "Based on your basket, search terms, and how you’re browsing the store.";

  const primaryCta = () => {
    if (isTravelLikeMission(activeMission.key)) {
      return { href: "/catalogue?q=travel+essentials", label: "Complete your trip kit" };
    }
    if (isCookingMissionKey(activeMission.key)) {
      if (hasCartItems) {
        return { href: "/cart#basket-bundle", label: "Add missing essentials" };
      }
      return { href: "/catalogue?q=dinner", label: "Shop for your meal" };
    }
    return { href: "/cart", label: "Review basket" };
  };

  const cta = primaryCta();

  if (collapsed) {
    return (
      <div className="fixed top-20 right-4 z-[100]" data-holmes="active-mission-bar">
        <button
          type="button"
          onClick={handleExpand}
          className="flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border border-aurora-border/60 bg-aurora-surface/95 backdrop-blur-sm hover:shadow-md hover:scale-[1.02] transition-all text-aurora-text"
          aria-label="Show suggestion"
          title="Show suggestion"
        >
          <Sparkles className="w-4 h-4 text-aurora-primary" />
          <span className="text-xs font-medium max-w-[10rem] truncate">{activeMission.label}</span>
          <ChevronDown className="w-3.5 h-3.5 text-aurora-muted rotate-[-90deg]" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed top-20 right-4 z-[100] w-[min(100%-2rem,26rem)]"
      data-holmes="active-mission-bar"
    >
      <div className="rounded-2xl border border-aurora-border/80 bg-aurora-surface/95 backdrop-blur-md shadow-lg shadow-aurora-primary/5 overflow-hidden">
        <div className="px-4 py-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-aurora-primary/10 shrink-0">
              <Sparkles className="w-4 h-4 text-aurora-primary" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p
                className="text-sm font-semibold text-aurora-text leading-snug transition-opacity duration-150 ease-out motion-reduce:transition-none"
                aria-live="polite"
                aria-atomic="true"
              >
                {headline}
              </p>
              <div className="relative" ref={whyRef}>
                <button
                  type="button"
                  onClick={() => setWhyOpen((o) => !o)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-aurora-primary hover:underline"
                >
                  <Info className="w-3 h-3 shrink-0" aria-hidden />
                  Why am I seeing this?
                </button>
                {whyOpen && (
                  <div className="absolute left-0 top-full z-[110] mt-1 w-full min-w-[240px] max-w-[min(100vw-2rem,22rem)] rounded-lg border border-aurora-border bg-aurora-bg p-3 text-xs text-aurora-muted shadow-lg whitespace-pre-line leading-relaxed">
                    {whyText}
                  </div>
                )}
              </div>
              <Link
                href={cta.href}
                className="inline-flex items-center justify-center w-full sm:w-auto px-3 py-2 rounded-lg bg-aurora-primary text-white text-sm font-semibold hover:opacity-95 transition-opacity"
              >
                {cta.label}
              </Link>
              {isCookingMissionKey(activeMission.key) && (
                <Link
                  href="/for-you/recipes"
                  className="block text-xs text-aurora-muted hover:text-aurora-primary font-medium"
                >
                  View recipes (optional) →
                </Link>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <button
              type="button"
              onClick={handleCollapse}
              className="p-2 rounded-lg text-aurora-muted hover:text-aurora-text hover:bg-aurora-surface-hover/80 transition-colors"
              aria-label="Collapse"
              title="Collapse"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-lg text-aurora-muted hover:text-aurora-text hover:bg-aurora-surface-hover/80 transition-colors"
              aria-label="Reset your session. Clears basket and browsing state, then reloads."
              title="Reset your session. Clears basket, session data, and starts fresh (reloads)."
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-2 rounded-lg text-aurora-muted hover:text-aurora-text hover:bg-aurora-surface-hover/80 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
