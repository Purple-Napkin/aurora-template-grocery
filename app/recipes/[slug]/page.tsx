import { RecipePageView } from "@/components/RecipePageView";
import { getStoreConfig } from "@aurora-studio/starter-core";
import { holmesRecipe } from "@aurora-studio/starter-core";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function RecipePage({ params }: Props) {
  const { slug } = await params;
  const safeSlug = slug?.trim();
  if (!safeSlug) notFound();

  const [recipe, config] = await Promise.all([
    holmesRecipe(safeSlug),
    getStoreConfig(),
  ]);

  if (!recipe) notFound();

  const currency =
    (config as { currency?: string })?.currency ?? "GBP";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <RecipePageView
        recipeSlug={recipe.slug}
        recipeTitle={recipe.title}
        currency={currency}
      />
    </div>
  );
}
