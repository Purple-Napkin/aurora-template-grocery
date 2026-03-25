import { getHomePersonalization } from "@aurora-studio/starter-core";

type P13nOpts = {
  excludeDietary?: string[];
  contentPage: string;
  contentRegion: string;
  categorySlug?: string | null;
};

const inflight = new Map<string, ReturnType<typeof getHomePersonalization>>();

function cacheKey(o: P13nOpts): string {
  const d = (o.excludeDietary ?? []).slice().sort().join(",");
  const cat = (o.categorySlug ?? "").toString().trim();
  return `${o.contentPage}\0${o.contentRegion}\0${cat}\0${d}`;
}

/**
 * Fetches home personalization once per process + cache key; reuses the same promise/result until restart.
 * Invalidation/TTL can be added later.
 */
export function getHomePersonalizationProcessCached(opts: P13nOpts) {
  const k = cacheKey(opts);
  let p = inflight.get(k);
  if (!p) {
    p = getHomePersonalization(undefined, {
      ...(opts.excludeDietary?.length ? { excludeDietary: opts.excludeDietary } : {}),
      contentPage: opts.contentPage,
      contentRegion: opts.contentRegion,
      ...(opts.categorySlug?.toString().trim()
        ? { categorySlug: opts.categorySlug.toString().trim() }
        : {}),
    });
    inflight.set(k, p);
  }
  return p;
}
