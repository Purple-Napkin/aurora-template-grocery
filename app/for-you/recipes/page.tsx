import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { RecipeFolioCarousel } from "@/components/RecipeFolioCarousel";

type Props = {
  searchParams: Promise<{ ingredients?: string }>;
};

function parseIngredients(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Recipe ideas for your cart – Holmes-matched recipes in a folio-style carousel.
 * Optional `?ingredients=pasta,parmesan,...` seeds suggestions when the cart is empty
 * (e.g. from catalogue recipe search → "Other suggestions?").
 */
export default async function ForYouRecipesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const seedIngredientNames = parseIngredients(sp.ingredients);

  return (
    <div className="min-h-screen bg-aurora-bg relative pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/for-you"
          className="inline-flex items-center gap-2 text-aurora-primary hover:text-aurora-primary-dark mb-6 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Back to For You
        </Link>
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-aurora-text">
            <Sparkles className="w-6 h-6 text-aurora-primary" aria-hidden />
            Recipe ideas for your cart
          </h1>
          <p className="text-aurora-muted mt-1">
            Recipes matched to what you&apos;re building – flip through to find your favourite.
          </p>
          {seedIngredientNames.length > 0 && (
            <p className="text-sm text-aurora-text mt-2">
              Using your search ingredients:{" "}
              <span className="font-medium">{seedIngredientNames.join(", ")}</span>
            </p>
          )}
        </div>

        <RecipeFolioCarousel seedIngredientNames={seedIngredientNames} />
      </div>
    </div>
  );
}
