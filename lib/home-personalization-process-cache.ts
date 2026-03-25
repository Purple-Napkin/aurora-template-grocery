import {
  cachedStoreContentPersonalization,
  getHomePersonalization,
} from "@aurora-studio/starter-core";

type P13nOpts = {
  excludeDietary?: string[];
  contentPage: string;
  contentRegion: string;
  categorySlug?: string | null;
};

/**
 * Store CMS / home-personalization via Next.js Data Cache (default 30m, tag + env in starter-core).
 * Request-level dedupe remains in `server-request-cache` (`react` cache).
 */
export function getHomePersonalizationProcessCached(opts: P13nOpts) {
  return cachedStoreContentPersonalization(
    {
      contentPage: opts.contentPage,
      contentRegion: opts.contentRegion,
      categorySlug: opts.categorySlug,
      excludeDietary: opts.excludeDietary,
    },
    () =>
      getHomePersonalization(undefined, {
        ...(opts.excludeDietary?.length ? { excludeDietary: opts.excludeDietary } : {}),
        contentPage: opts.contentPage,
        contentRegion: opts.contentRegion,
        ...(opts.categorySlug?.toString().trim()
          ? { categorySlug: opts.categorySlug.toString().trim() }
          : {}),
      })
  );
}
