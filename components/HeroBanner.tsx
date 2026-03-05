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
    <section className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden min-h-[360px]">
      <div className="absolute inset-0 bg-gradient-to-br from-aurora-accent/5 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-aurora-bg/80 via-transparent to-transparent" />
      <div
        className="absolute inset-0 opacity-25 scale-105"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(56,189,248,0.12),transparent)]" />
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {logoUrl ? (
          <Link href="/" className="mb-8 block drop-shadow-2xl transition-transform hover:scale-105">
            <img
              src={logoUrl}
              alt=""
              className="h-28 sm:h-36 md:h-44 w-auto object-contain max-w-[min(80vw,400px)]"
            />
          </Link>
        ) : (
          <p className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-8 text-white drop-shadow-2xl">
            {siteName}
          </p>
        )}
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-5 text-white drop-shadow-lg">
          {title}
        </h1>
        <p className="text-aurora-muted text-lg sm:text-xl max-w-2xl mx-auto font-medium mb-3 drop-shadow">
          {subtitle}
        </p>
        <p className="text-aurora-muted/80 text-sm max-w-xl mx-auto mb-8 drop-shadow">
          Browse vegetables, bakery, dairy, snacks & more — all from your favourite local stores.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          <Link
            href={banner?.link_url ?? "/catalogue"}
            className="inline-block px-8 py-4 rounded-xl bg-aurora-accent text-aurora-bg font-bold text-base hover:opacity-90 hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] transition-all duration-300"
          >
            Shop Now
          </Link>
          <Link
            href="/offers"
            className="inline-block px-8 py-4 rounded-xl border-2 border-white/40 text-white font-semibold text-base hover:bg-white/10 hover:border-white/60 transition-all duration-300"
          >
            View Offers
          </Link>
        </div>
      </div>
    </section>
  );
}
