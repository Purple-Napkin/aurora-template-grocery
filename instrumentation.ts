export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { warmHomePersonalizationCache } = await import(
    "@/lib/warm-home-personalization-cache"
  );
  await warmHomePersonalizationCache();
}
