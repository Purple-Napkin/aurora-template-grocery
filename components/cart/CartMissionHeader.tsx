"use client";

import { useMissionAware } from "@/components/MissionAwareHome";
import { isCookingMissionKey, isTravelLikeMission } from "@/lib/intent-mission";
import { getForgottenSuggestions } from "@/lib/cart-intelligence";

/**
 * Basket page narrative — frames the cart as a mission-completion surface.
 */
export function CartMissionHeader({ itemNames }: { itemNames: string[] }) {
  const data = useMissionAware();
  const m = data?.activeMission;
  const band = m?.band;
  const forgotten = getForgottenSuggestions(itemNames);
  const nudge =
    forgotten.length > 0
      ? `${forgotten.length} common add-on${forgotten.length === 1 ? "" : "s"} you might still need`
      : null;

  let title = "Complete your shop";
  let subtitle =
    m?.summary?.trim() ||
    "Review your lines, add anything missing, then head to checkout — we keep suggestions relevant to what you’re doing.";

  if (band === "high" && m) {
    if (isTravelLikeMission(m.key)) {
      title = "Complete your travel kit";
      subtitle =
        m.summary?.trim() ||
        "Based on your basket — finish essentials in one pass, then checkout fast.";
    } else if (isCookingMissionKey(m.key)) {
      title = nudge ? "Almost there for your meal" : "Finish your meal shop";
      subtitle =
        m.summary?.trim() ||
        (nudge
          ? `${nudge.charAt(0).toUpperCase() + nudge.slice(1)}. Based on your basket.`
          : "Add any missing ingredients, then checkout.");
    } else {
      title = `${m.label} — mode active`;
      subtitle = m.summary?.trim() || subtitle;
    }
  } else if (band === "medium" && m) {
    title = "Suggested next steps";
    subtitle =
      m.summary?.trim() ||
      `We think you might be focused on “${m.label}”. Add bundles or essentials below — dismiss anytime from the insight card.`;
  } else if (itemNames.length > 0) {
    title = "Your basket";
    subtitle =
      "Nothing is locked in — browse suggestions below or go straight to checkout when you’re ready.";
  }

  return (
    <header className="mb-6 rounded-2xl border border-aurora-border/90 bg-gradient-to-br from-aurora-surface to-[#f0f5f2] dark:from-aurora-surface dark:to-aurora-bg px-5 py-5 sm:px-6 sm:py-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-aurora-muted mb-2">
        Mission completion
      </p>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-aurora-text tracking-tight">
        {title}
      </h1>
      <p className="text-sm text-aurora-muted mt-2 max-w-2xl leading-relaxed">{subtitle}</p>
    </header>
  );
}
