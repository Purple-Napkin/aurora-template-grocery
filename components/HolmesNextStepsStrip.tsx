"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Compass } from "lucide-react";

export type HolmesNextStepWire = {
  route: string;
  fragmentType: string;
  confidence: number;
  prefetchable?: boolean;
  kind?: "predicted" | "suggestion";
  intentLabel?: string;
};

function hrefForCandidate(route: string, pathname: string, fragmentType: string): string {
  /** Dedicated alternate catalogue layout (not “another PDP” of the same product). */
  if (fragmentType === "product-detail") {
    return "/catalogue?view=personalized";
  }
  const r = route || "/";
  if (r === "/catalogue/[id]") {
    const m = pathname.match(/\/catalogue\/([^/]+)/);
    if (m?.[1]) return `/catalogue/${m[1]}`;
    return "/catalogue";
  }
  return r;
}

/**
 * Next-step strip under the nav: predicted flow vs exploratory probes
 * (infer payload + holmes:nextSteps events).
 */
export function HolmesNextStepsStrip() {
  const pathname = usePathname() ?? "/";
  const [steps, setSteps] = useState<HolmesNextStepWire[]>([]);
  const [missionSummary, setMissionSummary] = useState<string | null>(null);

  const apply = useCallback((detail: { candidates?: HolmesNextStepWire[]; mission?: { summary?: string } | null }) => {
    const c = detail.candidates;
    if (!c || !Array.isArray(c) || c.length === 0) {
      setSteps([]);
      return;
    }
    setSteps(c.slice(0, 5));
    const s = detail.mission?.summary;
    setMissionSummary(typeof s === "string" && s.trim() ? s.trim() : null);
  }, []);

  useEffect(() => {
    function onNextSteps(e: Event) {
      const ce = e as CustomEvent<{ candidates?: HolmesNextStepWire[]; mission?: { summary?: string } | null }>;
      apply({ candidates: ce.detail?.candidates, mission: ce.detail?.mission ?? null });
    }
    function onInfer(e: Event) {
      const ce = e as CustomEvent<{ candidates?: HolmesNextStepWire[]; mission?: { summary?: string } | null }>;
      if (ce.detail?.candidates?.length) apply(ce.detail);
    }
    document.addEventListener("holmes:nextSteps", onNextSteps);
    document.addEventListener("holmes:inferApplied", onInfer as EventListener);
    return () => {
      document.removeEventListener("holmes:nextSteps", onNextSteps);
      document.removeEventListener("holmes:inferApplied", onInfer as EventListener);
    };
  }, [apply]);

  if (steps.length === 0) return null;

  return (
    <div
      className="border-b border-stone-300/90 bg-[#e5e7eb] shadow-[inset_0_1px_0_rgb(255_255_255/0.65)] dark:border-stone-600/70 dark:bg-stone-800/95 dark:shadow-none"
      data-holmes-next-steps
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <Sparkles
            className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          <p className="text-xs font-bold uppercase tracking-widest text-stone-700 dark:text-stone-100 leading-tight">
            <span className="text-stone-800 dark:text-stone-50">We suggest next</span>
            {missionSummary ? (
              <span className="hidden md:inline font-normal normal-case tracking-normal text-stone-600 dark:text-stone-300">
                {" "}
                · {missionSummary}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 min-w-0 flex-1 items-center">
          {steps.map((c, i) => {
            const isProbe = c.kind === "suggestion";
            const href = hrefForCandidate(c.route, pathname, c.fragmentType);
            const label = c.intentLabel?.trim() || `${c.fragmentType.replace(/-/g, " ")}`;
            return (
              <Link
                key={`${c.route}-${c.fragmentType}-${i}`}
                href={href}
                className={
                  isProbe
                    ? "inline-flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-50/90 px-3 py-1.5 text-xs font-medium text-amber-950 shadow-sm shadow-amber-900/5 hover:bg-amber-100/95 transition-colors dark:border-amber-400/35 dark:bg-amber-950/40 dark:text-amber-50 dark:hover:bg-amber-950/55"
                    : "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/45 bg-emerald-50/90 px-3 py-1.5 text-xs font-medium text-emerald-950 shadow-sm shadow-emerald-900/5 hover:bg-emerald-100/95 transition-colors dark:border-emerald-400/35 dark:bg-emerald-950/35 dark:text-emerald-50 dark:hover:bg-emerald-950/50"
                }
                title={`${Math.round((c.confidence ?? 0) * 100)}% · ${c.fragmentType}`}
              >
                {isProbe ? <Compass className="w-3 h-3 shrink-0 opacity-80" aria-hidden /> : null}
                <span className="truncate max-w-[200px] sm:max-w-[240px]">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
