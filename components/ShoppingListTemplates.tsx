"use client";

import Link from "next/link";
import { useMissionAware } from "./MissionAwareHome";
import { ListChecks } from "lucide-react";
import { CONTENT_BLOCK_CARD_SHELL } from "./ContentBlockProductCard";

/**
 * Holmes-influenced shopping list templates. Shown when inference matches
 * (e.g. "Travel essentials" when travel prep detected from cart).
 */
export function ShoppingListTemplates() {
  const homeData = useMissionAware();
  const templates = homeData?.shoppingListTemplates;

  if (!templates?.length) return null;

  return (
    <section className="py-6">
      <div
        className={`rounded-xl bg-white overflow-hidden dark:bg-aurora-surface ${CONTENT_BLOCK_CARD_SHELL}`}
      >
        <div className="p-5 sm:p-6">
          <h2 className="text-xs font-semibold text-aurora-muted uppercase tracking-widest mb-4">
            Suggested lists
          </h2>
          <div className="flex flex-wrap gap-3">
            {templates.map((t) => {
              const searchQuery = t.searchTerms?.length
                ? t.searchTerms.join(" ")
                : t.label.toLowerCase().replace(/\s+/g, "+");
              const href = `/catalogue?q=${encodeURIComponent(searchQuery)}`;
              return (
                <Link
                  key={t.slug}
                  href={href}
                  className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#faf8f5] dark:bg-aurora-bg border border-stone-200/90 dark:border-aurora-border/80 shadow-sm hover:border-aurora-primary/40 hover:shadow-md hover:shadow-aurora-primary/5 transition-all font-medium text-aurora-text"
                >
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-aurora-primary/10 text-aurora-primary">
                    <ListChecks className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="block">{t.label}</span>
                    {t.description && (
                      <span className="block text-xs text-aurora-muted font-normal mt-0.5">
                        {t.description}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
