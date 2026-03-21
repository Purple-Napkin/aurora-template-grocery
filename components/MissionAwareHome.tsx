"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useDietaryExclusions } from "./DietaryExclusionsContext";
import { RecipeIngredientsSection } from "./RecipeIngredientsSection";
import { getStoreConfig } from "aurora-starter-core";
export type QuickAction = { label: string; href: string };
export type Mission = { label: string; href: string };
export type ShoppingListTemplate = { slug: string; label: string; description?: string; searchTerms: string[] };

export type ActiveMissionUiHints = {
  emphasizeMissions?: boolean;
  narrowCatalog?: boolean;
  showMissionBar?: boolean;
};

export type ActiveMission = {
  key: string;
  label: string;
  confidence: number;
  band: "low" | "medium" | "high";
  summary?: string;
  uiHints?: ActiveMissionUiHints;
};

export type HomePersonalization = {
  mode: "default" | "recipe_mission";
  recipeSlug?: string;
  recipeTitle?: string;
  quickActions?: QuickAction[];
  missions?: Mission[];
  shoppingListTemplates?: ShoppingListTemplate[];
  trustSignal?: string;
  activeMission?: ActiveMission;
} | null;

export type MissionAwareContextValue = (NonNullable<HomePersonalization> & { refresh: () => void }) | null;

const MissionAwareContext = createContext<MissionAwareContextValue>(null);

export function useMissionAware() {
  return useContext(MissionAwareContext);
}

/** Fetches home-personalization with Holmes sid. Provides mode, recipeSlug, recipeTitle, quickActions, missions. */
export function MissionAwareHomeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState<HomePersonalization>(null);
  const fetchRef = useRef<() => void>(() => {});
  const { excludeDietary } = useDietaryExclusions();

  const refresh = useCallback(() => {
    fetchRef.current();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchData = () => {
      const sid =
        (window as { holmes?: { getSessionId?: () => string } }).holmes?.getSessionId?.() ?? "";
      fetch(
        `/api/holmes/home-personalization?sid=${encodeURIComponent(sid)}${excludeDietary.length ? `&excludeDietary=${encodeURIComponent(excludeDietary.join(","))}` : ""}`
      )
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          const am = d.activeMission;
          setData({
            mode: d.mode === "recipe_mission" ? "recipe_mission" : "default",
            recipeSlug: d.recipeSlug,
            recipeTitle: d.recipeTitle,
            quickActions: Array.isArray(d.quickActions) ? d.quickActions : undefined,
            missions: Array.isArray(d.missions) ? d.missions : undefined,
            shoppingListTemplates: Array.isArray(d.shoppingListTemplates)
              ? d.shoppingListTemplates
              : undefined,
            trustSignal: typeof d.trustSignal === "string" ? d.trustSignal : undefined,
            activeMission:
              am && typeof am.key === "string" && typeof am.label === "string"
                ? {
                    key: am.key,
                    label: am.label,
                    confidence: typeof am.confidence === "number" ? am.confidence : 0,
                    band: ["low", "medium", "high"].includes(am.band) ? am.band : "low",
                    summary: typeof am.summary === "string" ? am.summary : undefined,
                    uiHints:
                      am.uiHints && typeof am.uiHints === "object"
                        ? {
                            emphasizeMissions: !!am.uiHints.emphasizeMissions,
                            narrowCatalog: !!am.uiHints.narrowCatalog,
                            showMissionBar: !!am.uiHints.showMissionBar,
                          }
                        : undefined,
                  }
                : undefined,
          });
        })
        .catch(() => {
          if (!cancelled) setData({ mode: "default" });
        });
    };
    fetchRef.current = fetchData;
    fetchData();
    const onReady = () => fetchData();
    document.addEventListener("holmes:ready", onReady);

    let debounce: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        debounce = null;
        fetchRef.current();
      }, 350);
    };
    const holmesEvents = [
      "holmes:search",
      "holmes:cartUpdate",
      "holmes:refreshHome",
      "holmes:productView",
      "holmes:recipeView",
      "holmes:missionBarReset",
    ] as const;
    holmesEvents.forEach((ev) => document.addEventListener(ev, scheduleRefetch));

    return () => {
      cancelled = true;
      document.removeEventListener("holmes:ready", onReady);
      holmesEvents.forEach((ev) => document.removeEventListener(ev, scheduleRefetch));
      if (debounce) clearTimeout(debounce);
    };
  }, [excludeDietary]);

  const pathname = usePathname();
  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | null = null;
    debounce = setTimeout(() => fetchRef.current(), 200);
    return () => {
      if (debounce) clearTimeout(debounce);
    };
  }, [pathname]);

  const value: MissionAwareContextValue =
    data ? { ...data, refresh } : (null as MissionAwareContextValue);

  return (
    <MissionAwareContext.Provider value={value}>
      {children}
    </MissionAwareContext.Provider>
  );
}

/** Hero area: always logo+form layout. When recipe mission, Holmes content replaces only the logo slot (left). */
export function MissionAwareHero({ children }: { children: React.ReactNode }) {
  return <div data-holmes="home-hero">{children}</div>;
}

/** Sections area: RecipeIngredientsSection when in recipe mission, else default sections (server component). */
export function MissionAwareSections({ children }: { children: React.ReactNode }) {
  const data = useMissionAware();
  const [currency, setCurrency] = useState("GBP");

  useEffect(() => {
    getStoreConfig().then((c) => {
      const curr = (c as { currency?: string })?.currency ?? "GBP";
      setCurrency(curr);
    });
  }, []);

  if (data?.mode === "recipe_mission" && data.recipeSlug && data.recipeTitle) {
    return (
      <RecipeIngredientsSection
        recipeSlug={data.recipeSlug}
        recipeTitle={data.recipeTitle}
        currency={currency}
      />
    );
  }
  return <>{children}</>;
}
