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

function hrefForCandidate(route: string, pathname: string): string {
  const r = route || "/";
  if (r === "/catalogue/[id]") {
    const m = pathname.match(/\/catalogue\/([^/]+)/);
    if (m?.[1]) return `/catalogue/${m[1]}`;
    return "/catalogue";
  }
  return r;
}

/**
 * Shows Holmes “predict the future” next steps as a slim strip under the nav:
 * predicted flow vs exploratory probes (from infer payload + holmes:nextSteps).
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
      className="border-b border-aurora-border/40 bg-gradient-to-r from-emerald-950/20 via-aurora-surface/95 to-violet-950/15 dark:from-emerald-950/40 dark:via-aurora-surface dark:to-violet-950/25"
      data-holmes-next-steps
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 shrink-0 text-xs font-semibold uppercase tracking-widest text-aurora-muted">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500/90" aria-hidden />
          <span>Next for you</span>
          {missionSummary ? (
            <span className="hidden md:inline font-normal normal-case tracking-normal text-aurora-muted/90 truncate max-w-[220px]">
              · {missionSummary}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 min-w-0 flex-1">
          {steps.map((c, i) => {
            const isProbe = c.kind === "suggestion";
            const href = hrefForCandidate(c.route, pathname);
            const label = c.intentLabel?.trim() || `${c.fragmentType.replace(/-/g, " ")}`;
            return (
              <Link
                key={`${c.route}-${c.fragmentType}-${i}`}
                href={href}
                className={
                  isProbe
                    ? "inline-flex items-center gap-1.5 rounded-full border border-amber-500/45 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100 hover:bg-amber-500/20 transition-colors"
                    : "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100 hover:bg-emerald-500/18 transition-colors"
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
