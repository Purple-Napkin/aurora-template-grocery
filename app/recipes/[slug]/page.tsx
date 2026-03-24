import { RecipePageView } from "@/components/RecipePageView";
import { StoreContentRails } from "@/components/StoreContentRails";
import { getStoreConfig, holmesCombo, isHolmesComboPending } from "@aurora-studio/starter-core";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function titleFromSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function RecipePage({ params }: Props) {
  const { slug } = await params;
  const safeSlug = slug?.trim();
  if (!safeSlug) notFound();

  const [combo, config] = await Promise.all([holmesCombo(safeSlug), getStoreConfig()]);

  if (!combo) notFound();

  const currency =
    (config as { currency?: string })?.currency ?? "GBP";

  const awaiting = isHolmesComboPending(combo);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <RecipePageView
        recipeSlug={awaiting ? safeSlug : combo.slug}
        recipeTitle={awaiting ? titleFromSlug(safeSlug) : combo.title}
        currency={currency}
        recipeAwaitingGeneration={awaiting}
      />
      <div className="mt-12 space-y-10">
        <StoreContentRails contentPage="recipe" contentRegion="recipe_below_title" />
        <StoreContentRails contentPage="recipe" contentRegion="recipe_below_ingredients" />
      </div>
    </div>
  );
}
