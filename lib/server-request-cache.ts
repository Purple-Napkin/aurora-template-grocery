import { cache } from "react";
import { getStoreConfig } from "@aurora-studio/starter-core";
import { getDietaryFromCookie } from "@/lib/dietary-server";
import { getHomePersonalizationProcessCached } from "@/lib/home-personalization-process-cache";

/** One store config resolution per RSC request (parallel callers share one fetch). */
export const getStoreConfigCached = cache(getStoreConfig);

/** One cookie parse per RSC request. */
export const getDietaryFromCookieCached = cache(getDietaryFromCookie);

/**
 * One home-personalization fetch per (page, region, category) per request.
 * Use instead of raw `getHomePersonalization` when the same route may load several rails in parallel.
 */
export const getHomePersonalizationCached = cache(
  async (contentPage: string, contentRegion: string, categorySlug: string = "") => {
    const excludeDietary = await getDietaryFromCookieCached();
    const dietaryOpts = excludeDietary.length ? { excludeDietary } : undefined;
    const cat = categorySlug.trim();
    return getHomePersonalizationProcessCached({
      ...dietaryOpts,
      contentPage,
      contentRegion,
      categorySlug: cat || undefined,
    });
  }
);
