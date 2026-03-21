import Link from "next/link";
import { holmesRecentRecipes } from "aurora-starter-core";
import { getTimeOfDay } from "aurora-starter-core";
import { getDietaryFromCookie } from "@/lib/dietary-server";
import { ChefHat } from "lucide-react";

/**
 * Displays recent recipes from the Holmes cache on the home page.
 * Links to /recipes/[slug] for each recipe.
 */
export async function RecentRecipes() {
  const timeOfDay = getTimeOfDay();
  const excludeDietary = await getDietaryFromCookie();
  const dietaryOpts = excludeDietary.length ? { excludeDietary } : undefined;
  const { recipes } = await holmesRecentRecipes(8, timeOfDay, dietaryOpts);

  if (!recipes?.length) return null;

  return (
    <section className="py-10">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <ChefHat className="w-6 h-6 text-aurora-primary" />
        Recipe ideas for {timeOfDay}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {recipes.map((r) => (
          <Link
            key={r.id}
            href={`/recipes/${encodeURIComponent(r.slug)}`}
            className="group block p-4 rounded-xl bg-aurora-surface border border-aurora-border hover:border-aurora-primary/40 hover:shadow-md transition-all"
          >
            <h3 className="font-semibold text-sm sm:text-base truncate group-hover:text-aurora-primary">
              {r.title}
            </h3>
            {r.description && (
              <p className="text-aurora-muted text-xs sm:text-sm line-clamp-2 mt-1">
                {r.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
