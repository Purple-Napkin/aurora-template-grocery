import { StoreContextBar } from "@/components/StoreContextBar";
import { HeroBanner } from "@/components/HeroBanner";
import { SpecialOffers } from "@/components/SpecialOffers";
import { CategoryNav } from "@/components/CategoryNav";
import { HolmesHomeRefresher } from "@/components/HolmesHomeRefresher";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <HolmesHomeRefresher />
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <StoreContextBar />
      </div>

      {/* Hero breaks out to full viewport width — no dark side bars */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div data-holmes="home-hero">
          <HeroBanner />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <CategoryNav />

        {/* Category shortcut chips for quick discovery */}
        <div className="flex flex-wrap gap-2 py-6">
          {[
            { name: "Fruit", slug: "fruits" },
            { name: "Vegetables", slug: "vegetables" },
            { name: "Milk", slug: "dairy-products" },
            { name: "Bread", slug: "bakery-items" },
            { name: "Frozen", slug: "frozen-foods" },
            { name: "Snacks", slug: "snacks" },
          ].map((cat) => (
            <a
              key={cat.slug}
              href={`/catalogue?category=${cat.slug}`}
              className="shrink-0 px-4 py-2.5 rounded-full bg-aurora-surface border border-aurora-border hover:border-aurora-primary hover:text-aurora-primary text-sm font-medium transition-all duration-200"
            >
              {cat.name}
            </a>
          ))}
        </div>

      {/* Holmes script injects personalized sections (Meals, Top up, Inspiration) when data-holmes=home-sections exists */}
      <div data-holmes="home-sections" className="py-6" />

      <section className="py-12">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          Special Offers
          <span className="text-aurora-muted text-base font-normal">Store-specific offers</span>
        </h2>
        <SpecialOffers />
      </section>
      </div>
    </>
  );
}
