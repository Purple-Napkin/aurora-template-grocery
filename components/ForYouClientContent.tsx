"use client";

import Link from "next/link";
import { useCart } from "@aurora-studio/starter-core";
import { HolmesContextualWell } from "@/components/HolmesContextualWell";
import { RecipePicker } from "@/components/RecipePicker";
import { BasketBundlePlaceholder } from "@/components/BasketBundlePlaceholder";
import { CompleteYourMeal } from "@/components/CompleteYourMeal";
import { ForgotSuggestions } from "@/components/ForgotSuggestions";
import { Sparkles } from "lucide-react";

/** Client-only parts of For You page (cart-dependent). */
export function ForYouClientContent({
  belowTitle,
  sections,
}: {
  belowTitle?: React.ReactNode;
  sections: React.ReactNode;
}) {
  const { items } = useCart();
  const hasCartItems = items.length > 0;

  return (
    <div className="max-w-5xl mx-auto py-14 sm:py-16 px-4 sm:px-6">
      <div className="mb-10 sm:mb-12">
        <p className="text-[0.6875rem] font-medium text-aurora-muted/90 uppercase tracking-[0.16em] mb-3">
          Personal
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-aurora-text flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-aurora-primary/10 text-aurora-primary shadow-[0_2px_12px_rgba(47,93,69,0.08)]">
            <Sparkles className="w-5 h-5" aria-hidden />
          </span>
          For You
        </h1>
        <p className="text-aurora-muted mt-3 text-base max-w-xl leading-relaxed">
          Bundles, recipes, and suggestions assembled just for you.
        </p>
        {belowTitle}
      </div>

      <div className="space-y-10 sm:space-y-12">
        <HolmesContextualWell variant="for-you" />

        {hasCartItems && (
          <>
            <section id="recipe-picker" className="scroll-mt-24">
              <RecipePicker />
            </section>
            <section id="basket-bundle" className="mb-6">
              <div data-holmes="basket-bundle" className="min-h-[1px]" />
              <BasketBundlePlaceholder />
            </section>
            <CompleteYourMeal />
            <ForgotSuggestions />
          </>
        )}

        {sections}
      </div>

      {hasCartItems && (
        <div className="mt-14 pt-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-aurora-accent text-aurora-bg font-medium shadow-md shadow-aurora-primary/20 transition-[transform,box-shadow,opacity] duration-luxury ease-concierge hover:opacity-95 hover:shadow-lg hover:shadow-aurora-primary/25 hover:-translate-y-0.5 active:scale-[0.99]"
          >
            View basket ({items.length} {items.length === 1 ? "item" : "items"}) →
          </Link>
        </div>
      )}
    </div>
  );
}
