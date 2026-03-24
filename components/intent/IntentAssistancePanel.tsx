"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMissionAware } from "@/components/MissionAwareHome";
import { useCart } from "@aurora-studio/starter-core";
import { Sparkles } from "lucide-react";
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
    <section className="mb-8" aria-label="Basket assistance">
      <div className="rounded-[1.25rem] border border-aurora-border/30 bg-white/75 backdrop-blur-md dark:bg-aurora-surface/75 px-5 py-5 sm:px-6 sm:py-5 shadow-[0_4px_24px_rgba(27,67,50,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-[box-shadow] duration-luxury ease-concierge">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-aurora-primary/10 text-aurora-primary">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-aurora-text">Want help with your basket?</p>
              <p className="text-sm text-aurora-muted mt-1 leading-relaxed">{hint}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link
              href="/cart"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-2xl bg-aurora-primary text-white text-sm font-medium shadow-sm shadow-aurora-primary/15 transition-[transform,box-shadow,background-color] duration-luxury ease-concierge hover:bg-aurora-primary-dark hover:shadow-md hover:shadow-aurora-primary/18 active:scale-[0.99]"
            >
              Review basket
            </Link>
            <Link
              href="/catalogue"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-2xl border border-aurora-border/50 text-aurora-text text-sm font-medium bg-white/50 dark:bg-transparent transition-[background-color,border-color] duration-luxury ease-concierge hover:bg-aurora-surface-hover/80 hover:border-aurora-border"
            >
              Keep shopping
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
