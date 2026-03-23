"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMissionAware } from "@/components/MissionAwareHome";
import { useCart } from "@aurora-studio/starter-core";
import { Sparkles } from "lucide-react";
import { CONTENT_BLOCK_CARD_SHELL } from "@/components/ContentBlockProductCard";
import { alignedMissionTrustLine } from "@/lib/intent-mission";

/**
 * Homepage-only: low-confidence gentle prompt when the cart has items but we are not in medium/high mode UI.
 */
export function IntentAssistancePanel() {
  const pathname = usePathname();
  const data = useMissionAware();
  const { items } = useCart();

  if (pathname !== "/") return null;

  const band = data?.activeMission?.band;
  if (band === "medium" || band === "high") return null;
  if (items.length === 0) return null;

  const am = data?.activeMission;
  const hint = am
    ? alignedMissionTrustLine(am.key, am.label, am.summary, items.length > 0)
    : "Explore ideas based on what you’ve picked, or head to checkout when you’re ready.";

  return (
    <section className="mb-6" aria-label="Basket assistance">
      <div
        className={`rounded-xl border border-aurora-border/80 bg-aurora-surface/90 px-4 py-4 sm:px-5 sm:py-4 ${CONTENT_BLOCK_CARD_SHELL}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-aurora-primary/10 text-aurora-primary">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-aurora-text">Want help with your basket?</p>
              <p className="text-sm text-aurora-muted mt-0.5">{hint}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href="/cart"
              className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-aurora-primary text-white text-sm font-medium hover:opacity-95 transition-opacity"
            >
              Review basket
            </Link>
            <Link
              href="/catalogue"
              className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-aurora-border text-aurora-text text-sm font-medium hover:bg-aurora-surface-hover transition-colors"
            >
              Keep shopping
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
