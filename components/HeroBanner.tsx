import Link from "next/link";
import { createAuroraClient, getStoreConfig } from "@aurora-studio/starter-core";

function getTimeOfDayOverrides(hour: number): { title?: string; cta?: string } | null {
  if (hour >= 5 && hour < 11) return { title: "Start the day right", cta: "Shop breakfast" };
  if (hour >= 11 && hour < 14) return { title: "Lunch sorted", cta: "Grab lunch" };
  if (hour >= 17 && hour < 21) return { title: "Dinner in 5mins", cta: "Shop dinner" };
  return null;
}

function getHourInTimezone(timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    return parseInt(formatter.format(new Date()), 10);
  } catch {
    return new Date().getHours();
  }
}

/**
 * Fetches hero banners from CMS (hero_banners table) when available.
 * Falls back to default hero content when table is empty or missing.
 * Varies title/CTA by time of day (store timezone) when no CMS override.
 */
export async function HeroBanner() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Store";
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL ?? "";
  const defaultImage = "/Hippo-Hero.jpg";
  const config = await getStoreConfig();
  const timezone = (config as { timezone?: string })?.timezone ?? "Europe/London";
  const hour = getHourInTimezone(timezone);
  const timeOverrides = getTimeOfDayOverrides(hour);

  let banners: Array<{ title?: string; subtitle?: string; image_url?: string; link_url?: string }> = [];

  try {
    const aurora = createAuroraClient();
    const { data } = await aurora.tables("hero_banners").records.list({
      limit: 1,
      sort: "sort_order",
      order: "asc",
    });
    banners = (data ?? []).filter((b) => b.title ?? b.image_url);
  } catch {
    /* hero_banners table may not exist */
  }

  const banner = banners[0];
  const bgImage = banner?.image_url || defaultImage;
  const baseTitle = banner?.title ?? "Your weekly shop in 5mins";
  const title = banner?.title ? baseTitle : (timeOverrides?.title ?? baseTitle);
  const subtitle = banner?.subtitle ?? "Fresh groceries from local stores delivered today.";

  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden min-h-[340px]">
      <div
        className="absolute inset-0 scale-105"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-white/75" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent" />
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {logoUrl ? (
          <Link href="/" className="mb-6 block transition-transform hover:scale-[1.02]">
            <img
              src={logoUrl}
              alt=""
              className="h-24 sm:h-28 md:h-32 w-auto object-contain max-w-[min(80vw,360px)] drop-shadow-sm"
            />
          </Link>
        ) : (
          <p className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 text-aurora-text">
            {siteName}
          </p>
        )}
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-aurora-text max-w-4xl">
          {title}
        </h1>
        <p className="text-aurora-muted text-base sm:text-lg max-w-2xl mx-auto font-medium mb-2">
          {subtitle}
        </p>
        <p className="text-aurora-muted text-sm max-w-xl mx-auto mb-8">
          Browse vegetables, bakery, dairy, snacks & more - all from your favourite local stores.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href={banner?.link_url ?? "/catalogue"}
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-aurora-primary text-white font-semibold text-base hover:bg-aurora-primary-dark transition-colors duration-200 shadow-sm"
          >
            {timeOverrides?.cta ?? "Start Shopping"}
          </Link>
          <Link
            href="/catalogue"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl border-2 border-aurora-primary text-aurora-primary font-semibold text-base hover:bg-aurora-primary/5 transition-colors duration-200"
          >
            Browse Categories
          </Link>
        </div>
      </div>
    </section>
  );
}
