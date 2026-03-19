"use client";

import Link from "next/link";

interface RecipeMissionHeroProps {
  recipeTitle: string;
  recipeSlug: string;
}

export function RecipeMissionHero({ recipeTitle, recipeSlug }: RecipeMissionHeroProps) {
  const displayTitle = recipeTitle.length > 60 ? recipeTitle.slice(0, 57) + "…" : recipeTitle;
  return (
    <div className="w-full relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-aurora-primary/15 via-aurora-primary/8 to-aurora-surface border border-aurora-primary/30 px-6 py-10 sm:px-10 sm:py-14">
      <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-aurora-text mb-2">
        Making {displayTitle}?
      </h1>
      <p className="text-aurora-muted text-base sm:text-lg max-w-xl mb-6">
        We&apos;ve found everything you need. View the full recipe and add ingredients to your basket in one tap.
      </p>
      <Link
        href={`/catalogue?q=${encodeURIComponent(recipeSlug)}`}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-aurora-primary text-white font-semibold hover:bg-aurora-primary-dark transition-colors"
      >
        View recipe & ingredients
      </Link>
    </div>
  );
}
