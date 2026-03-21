"use client";

import { useCart } from "@aurora-studio/starter-core";
import { getBasketSaverTip } from "@/lib/easter-eggs";
import Link from "next/link";
import { PiggyBank, Sparkles } from "lucide-react";

/** Contextual money-saving tips on the cart page. "Switch to cheaper olive oil" etc. */
export function BasketSaverTips() {
  const { items } = useCart();
  const names = items.map((i) => i.name).filter(Boolean);
  const result = getBasketSaverTip(names);

  if (!result || items.length === 0) return null;

  const { tip, searchHint } = result;

  return (
    <div className="pattern-well mb-6 flex items-start gap-3 rounded-xl border border-aurora-primary/30 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aurora-primary/15 text-aurora-primary">
        <PiggyBank className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-aurora-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Little tip from us
        </p>
        <p className="mt-1 text-sm text-aurora-text leading-relaxed">{tip}</p>
        {searchHint && (
          <Link
            href={`/catalogue?q=${encodeURIComponent(searchHint)}`}
            className="mt-2 inline-block text-sm font-medium text-aurora-primary hover:underline"
          >
            Browse {searchHint} →
          </Link>
        )}
      </div>
    </div>
  );
}
