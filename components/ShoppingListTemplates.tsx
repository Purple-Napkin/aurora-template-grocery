"use client";

import Link from "next/link";
import { useMissionAware } from "./MissionAwareHome";
import { ListChecks } from "lucide-react";
import { CONTENT_BLOCK_PANEL_SHELL } from "./ContentBlockProductCard";

/**
 * Holmes-influenced shopping list templates. Shown when inference matches
 * (e.g. "Travel essentials" when travel prep detected from cart).
 */
export function ShoppingListTemplates() {
  const homeData = useMissionAware();
  const templates = homeData?.shoppingListTemplates;

  if (!templates?.length) return null;

  return (
    <section className="py-8 sm:py-10">
      <div
        className={`rounded-[1.35rem] bg-white/85 backdrop-blur-md overflow-hidden dark:bg-aurora-surface/85 ${CONTENT_BLOCK_PANEL_SHELL}`}
      >
        <div className="p-6 sm:p-7">
          <h2 className="text-[0.6875rem] font-medium text-aurora-muted/90 uppercase tracking-[0.14em] mb-5">
            Suggested lists
          </h2>
          <div className="flex flex-wrap gap-3.5">
            {templates.map((t) => {
              const searchQuery = t.searchTerms?.length
                ? t.searchTerms.join(" ")
                : t.label.toLowerCase().replace(/\s+/g, "+");
              const href = `/catalogue?q=${encodeURIComponent(searchQuery)}`;
              return (
                <Link
                  key={t.slug}
                  href={href}
                  className="flex w-full sm:w-auto max-w-full items-center gap-3.5 px-5 py-3.5 rounded-full bg-white/80 dark:bg-white/[0.05] border border-aurora-border/35 dark:border-aurora-border/45 shadow-[0_2px_12px_rgba(27,67,50,0.05)] font-medium text-aurora-text transition-[transform,box-shadow,border-color] duration-luxury ease-concierge hover:-translate-y-0.5 hover:border-aurora-primary/22 hover:shadow-[0_8px_24px_rgba(47,93,69,0.1)]"
                >
                  <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-aurora-primary/10 text-aurora-primary">
                    <ListChecks className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <span className="block break-words">{t.label}</span>
                    {t.description && (
                      <span className="block break-words text-xs text-aurora-muted font-normal mt-0.5">
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
