"use client";

import { useState, useEffect } from "react";
import { useCart } from "@aurora-studio/starter-core";

const CART_KEY = "aurora-cart";
const HOLMES_HOLDOUT = "holmes_holdout";

function isHolmesDisabled(): boolean {
  if (typeof document === "undefined") return false;
  return /holmes_holdout\s*=\s*1/.test(document.cookie);
}

function setHolmesDisabled(disabled: boolean): void {
  if (typeof document === "undefined") return;
  if (disabled) {
    document.cookie = `${HOLMES_HOLDOUT}=1; path=/; SameSite=Lax; max-age=31536000`;
  } else {
    document.cookie = `${HOLMES_HOLDOUT}=; path=/; SameSite=Lax; max-age=0`;
  }
}

/** Holmes dev tools: reset session, toggle Holmes on/off. Shown in dev and production. */
export function HolmesDevTools() {
  const { clearCart } = useCart();
  const [holmesDisabled, setHolmesDisabledState] = useState(false);

  useEffect(() => {
    setHolmesDisabledState(isHolmesDisabled());
  }, []);

  useEffect(() => {
    const el = document.body;
    const prev = el.style.paddingBottom;
    el.style.paddingBottom = "calc(3.25rem + env(safe-area-inset-bottom, 0px))";
    return () => {
      el.style.paddingBottom = prev;
    };
  }, []);

  const handleResetSession = () => {
    clearCart();
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(CART_KEY);
    }
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.clear();
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? "h_reset_" + crypto.randomUUID().replace(/-/g, "").slice(0, 20)
          : "h_reset_" + String(Date.now()) + "_" + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem("holmes_sid_override", id);
    }
    window.location.reload();
  };

  const handleToggleHolmes = () => {
    const disabled = isHolmesDisabled();
    setHolmesDisabled(!disabled);
    window.location.reload();
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-3 py-2 bg-aurora-surface/95 border-t border-aurora-border text-xs"
      role="group"
      aria-label="Holmes development tools"
    >
      <span className="text-aurora-muted">Dev:</span>
      <button
        type="button"
        onClick={handleResetSession}
        className="px-3 py-1.5 rounded border border-aurora-border hover:bg-aurora-surface-hover text-aurora-text transition-colors"
        title="Clear cart, session storage, and reload for a fresh Holmes session"
      >
        Reset Holmes session
      </button>
      <button
        type="button"
        onClick={handleToggleHolmes}
        className={`px-3 py-1.5 rounded border transition-colors ${
          holmesDisabled
            ? "border-aurora-primary bg-aurora-primary/20 text-aurora-primary hover:bg-aurora-primary/30"
            : "border-aurora-border hover:bg-aurora-surface-hover text-aurora-text"
        }`}
        title={holmesDisabled ? "Re-enable Holmes" : "Disable Holmes to see site without it"}
      >
        {holmesDisabled ? "Holmes off (click to enable)" : "Disable Holmes"}
      </button>
    </div>
  );
}
