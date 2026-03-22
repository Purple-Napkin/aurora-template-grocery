"use client";

import { useEffect, useState } from "react";
import { CONTENT_BLOCK_CARD_SHELL } from "./ContentBlockProductCard";

/** Skeleton for basket-bundle. Hides when Holmes injects or after ~3s. Renders as sibling so Holmes can replace container content. */
export function BasketBundlePlaceholder() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const check = () => {
      const hasHolmesContent = document.querySelector(
        "[data-holmes=basket-bundle] [data-holmes-bundle]"
      );
      if (hasHolmesContent) setVisible(false);
    };
    const timer = setTimeout(() => setVisible(false), 3000);
    const observer = new MutationObserver(check);
    const container = document.querySelector("[data-holmes=basket-bundle]");
    if (container) observer.observe(container, { childList: true, subtree: true });
    check();
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`animate-pulse rounded-xl bg-white overflow-hidden p-4 ${CONTENT_BLOCK_CARD_SHELL}`}
      aria-hidden="true"
    >
      <div className="h-5 w-56 bg-aurora-surface-hover rounded mb-4" />
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-20 h-20 rounded-lg bg-aurora-surface-hover shrink-0" />
        ))}
      </div>
      <div className="h-10 w-64 bg-aurora-surface-hover rounded-lg mt-4" />
    </div>
  );
}
