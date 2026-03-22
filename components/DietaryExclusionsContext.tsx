"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";

/** Dietary exclusion keys - used for API filtering and localStorage. */
export type DietaryExclusionKey =
  | "meat"
  | "animal_products"
  | "dairy"
  | "alcohol";

export const DIETARY_OPTIONS: {
  key: DietaryExclusionKey;
  label: string;
}[] = [
  { key: "meat", label: "No meat products" },
  { key: "animal_products", label: "No animal products" },
  { key: "dairy", label: "No dairy" },
  { key: "alcohol", label: "No alcohol" },
];

const STORAGE_KEY = "aurora-dietary-exclusions";
const COOKIE_NAME = "aurora-dietary";

function loadExclusions(): Set<DietaryExclusionKey> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();
    const arr = JSON.parse(stored) as unknown[];
    return new Set(
      arr.filter((k): k is DietaryExclusionKey =>
        ["meat", "animal_products", "dairy", "alcohol"].includes(String(k))
      )
    );
  } catch {
    return new Set();
  }
}

function saveExclusions(set: Set<DietaryExclusionKey>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  const value = [...set].filter((k) =>
    ["meat", "animal_products", "dairy", "alcohol"].includes(k)
  );
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value.join(","))};path=/;max-age=31536000;samesite=lax`;
}

interface DietaryExclusionsContextValue {
  /** Which exclusions are enabled (e.g. meat, dairy) */
  exclusions: Set<DietaryExclusionKey>;
  /** Whether a given exclusion is enabled */
  has: (key: DietaryExclusionKey) => boolean;
  /** Toggle an exclusion on/off */
  toggle: (key: DietaryExclusionKey) => void;
  /** Array of exclusion keys for API - e.g. ["meat","dairy"] */
  excludeDietary: DietaryExclusionKey[];
}

const DietaryExclusionsContext =
  createContext<DietaryExclusionsContextValue | null>(null);

export function DietaryExclusionsProvider({ children }: { children: ReactNode }) {
  const [exclusions, setExclusionsState] = useState<Set<DietaryExclusionKey>>(
    () => new Set()
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loaded = loadExclusions();
    setExclusionsState(loaded);
    saveExclusions(loaded);
    setMounted(true);
  }, []);

  const toggle = useCallback((key: DietaryExclusionKey) => {
    setExclusionsState((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      saveExclusions(next);
      return next;
    });
  }, []);

  const has = useCallback(
    (key: DietaryExclusionKey) => exclusions.has(key),
    [exclusions]
  );

  const excludeDietary = useMemo(
    () => (mounted ? [...exclusions] : []),
    [mounted, exclusions]
  );

  return (
    <DietaryExclusionsContext.Provider
      value={{
        exclusions,
        has,
        toggle,
        excludeDietary,
      }}
    >
      {children}
    </DietaryExclusionsContext.Provider>
  );
}

export function useDietaryExclusions() {
  const ctx = useContext(DietaryExclusionsContext);
  if (!ctx)
    throw new Error("useDietaryExclusions must be used within DietaryExclusionsProvider");
  return ctx;
}
