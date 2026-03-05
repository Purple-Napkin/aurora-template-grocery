import Link from "next/link";
import { createAuroraClient } from "@/lib/aurora";

/**
 * Fetches hero banners from CMS (hero_banners table) when available.
 * Falls back to default hero content when table is empty or missing.
 */
export async function HeroBanner() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Store";
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL ?? "";
  const defaultImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600";

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
  const title = banner?.title ?? "Fresh groceries delivered to your door";
  const subtitle = banner?.subtitle ?? "Quality products at affordable prices, delivered when you need them.";

  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden min-h-[320px]">
      <div className="absolute inset-0 bg-gradient-to-b from-aurora-surface/30 to-transparent" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {logoUrl ? (
          <Link href="/" className="mb-6 block drop-shadow-2xl">
            <img
              src={logoUrl}
              alt=""
              className="h-24 sm:h-32 md:h-40 w-auto object-contain max-w-[min(80vw,360px)]"
            />
          </Link>
        ) : (
          <p className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 text-white drop-shadow-2xl">
            {siteName}
          </p>
        )}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white drop-shadow-lg">
          {title}
        </h1>
        <p className="text-aurora-muted text-base sm:text-lg max-w-2xl mx-auto font-medium mb-2 drop-shadow">
          {subtitle}
        </p>
        <p className="text-aurora-muted/80 text-sm max-w-xl mx-auto mb-8 drop-shadow">
          Browse vegetables, bakery, dairy, snacks & more — all from your favourite local stores.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href={banner?.link_url ?? "/catalogue"}
            className="inline-block px-8 py-4 rounded-component bg-aurora-accent text-aurora-bg font-bold text-base hover:opacity-90 hover:shadow-lg transition-all"
          >
            Shop Now
          </Link>
          <Link
            href="/promotions"
            className="inline-block px-8 py-4 rounded-component border-2 border-white/30 text-white font-bold text-base hover:bg-white/10 transition-all"
          >
            View Promotions
          </Link>
        </div>
      </div>
    </section>
  );
}
