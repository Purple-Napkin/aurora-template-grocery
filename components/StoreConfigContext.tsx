"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getStoreConfig } from "@/lib/aurora";

interface StoreConfigContextValue {
  imageBaseUrl: string | null;
}

const StoreConfigContext = createContext<StoreConfigContextValue | null>(null);

export function StoreConfigProvider({ children }: { children: ReactNode }) {
  const [imageBaseUrl, setImageBaseUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStoreConfig()
      .then((config) => {
        if (!cancelled && config) {
          const base = (config as Record<string, unknown>).imageBaseUrl;
          if (typeof base === "string") setImageBaseUrl(base);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <StoreConfigContext.Provider value={{ imageBaseUrl }}>
      {children}
    </StoreConfigContext.Provider>
  );
}

export function useStoreConfigImageBase(): string | null {
  const ctx = useContext(StoreConfigContext);
  return ctx?.imageBaseUrl ?? null;
}
