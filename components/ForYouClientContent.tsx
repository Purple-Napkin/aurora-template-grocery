"use client";

import Link from "next/link";
import { useCart } from "aurora-starter-core";
import { HolmesContextualWell } from "@/components/HolmesContextualWell";
import { RecipePicker } from "@/components/RecipePicker";
import { BasketBundlePlaceholder } from "@/components/BasketBundlePlaceholder";
import { CompleteYourMeal } from "@/components/CompleteYourMeal";
import { ForgotSuggestions } from "@/components/ForgotSuggestions";
import { Sparkles } from "lucide-react";

/** Client-only parts of For You page (cart-dependent). */
export function ForYouClientContent({
  sections,
}: {
  sections: React.ReactNode;
}) {
  const { items } = useCart();
  const hasCartItems = items.length > 0;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-aurora-primary" aria-hidden />
          For You
        </h1>
        <p className="text-aurora-muted mt-1">
          Bundles, recipes, and suggestions assembled just for you.
        </p>
      </div>

      <div className="space-y-8">
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
        <div className="mt-10 pt-6 border-t border-aurora-border">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-component bg-aurora-accent text-aurora-bg font-semibold hover:opacity-90 transition-opacity"
          >
            View basket ({items.length} {items.length === 1 ? "item" : "items"}) →
          </Link>
        </div>
      )}
    </div>
  );
}
