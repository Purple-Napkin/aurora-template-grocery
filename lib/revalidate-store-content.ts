import { revalidateStoreContentDataCache } from "@aurora-studio/starter-core";
import { warmHomePersonalizationCache } from "./warm-home-personalization-cache";

/**
 * Purge tagged store-content Data Cache entries, then repopulate common CMS slots.
 * Use after CMS publish (webhook → Server Action) or from the Vercel cron route so
 * visitors do not pay a cold Aurora fetch.
 */
export async function revalidateStoreContentAndWarm(): Promise<void> {
  revalidateStoreContentDataCache();
  await warmHomePersonalizationCache();
}
