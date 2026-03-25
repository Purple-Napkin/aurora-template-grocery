/**
 * Optional CMS warm at process start. Off by default — a burst of parallel
 * home-personalization calls on every cold start can stress the Aurora API and
 * contribute to Holmes `/holmes/infer` failures under load.
 *
 * Enable explicitly: `AURORA_WARM_HOME_PERSONALIZATION=1`
 *
 * Editorial payloads are still cached on first real request via
 * `getHomePersonalizationProcessCached` without this flag.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.AURORA_WARM_HOME_PERSONALIZATION !== "1") return;
  void import("@/lib/warm-home-personalization-cache")
    .then((m) => m.warmHomePersonalizationCache())
    .catch(() => {});
}
