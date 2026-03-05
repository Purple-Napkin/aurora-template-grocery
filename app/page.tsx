import { StoreContextBar } from "@/components/StoreContextBar";
import { HeroBanner } from "@/components/HeroBanner";
import { SpecialOffers } from "@/components/SpecialOffers";
import { CategoryNav } from "@/components/CategoryNav";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto">
      <StoreContextBar />

      <HeroBanner />

      <CategoryNav />

      <section className="py-12 px-4 sm:px-6">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          Special Offers
          <span className="text-aurora-muted text-base font-normal">Store-specific promotions</span>
        </h2>
        <SpecialOffers />
      </section>
    </div>
  );
}
