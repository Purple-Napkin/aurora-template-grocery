import type { HomePersonalizationResult } from "@aurora-studio/sdk";

const inflight = new Map<string, Promise<HomePersonalizationResult>>();

/** One in-flight GET per URL so MissionAwareHome + ClientStoreContentRail share a single network call. */
export function fetchHomePersonalizationDeduped(url: string): Promise<HomePersonalizationResult> {
  let p = inflight.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`home-personalization HTTP ${r.status}`);
        return r.json() as Promise<HomePersonalizationResult>;
      })
      .finally(() => {
        inflight.delete(url);
      });
    inflight.set(url, p);
  }
  return p;
}
