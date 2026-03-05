import Link from "next/link";
import { createAuroraClient } from "@/lib/aurora";

/**
 * Fetches hero banners from CMS (hero_banners table) when available.
 * Falls back to default hero content when table is empty or missing.
 */
export async function HeroBanner() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Store";
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL ?? "";
  const defaultImage = "/Hippo-Hero.jpg";

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
  const title = banner?.title ?? "Your weekly shop in 20 minutes";
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
          Browse vegetables, bakery, dairy, snacks & more — all from your favourite local stores.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href={banner?.link_url ?? "/catalogue"}
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-aurora-primary text-white font-semibold text-base hover:bg-aurora-primary-dark transition-colors duration-200 shadow-sm"
          >
            Start Shopping
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
