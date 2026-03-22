import Link from "next/link";
import { InsightBlurb } from "@/components/InsightBlurb";
import { StoreContentRails } from "@/components/StoreContentRails";

export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6">
      <h1 className="text-3xl font-bold text-center mb-4">How We Work</h1>
      <StoreContentRails contentPage="about" contentRegion="about_main" className="mb-12" />
      <div className="space-y-12 mt-8">
        <div className="flex gap-6 items-start">
          <div className="w-16 h-16 rounded-full bg-aurora-accent/30 flex items-center justify-center text-2xl font-bold text-aurora-accent shrink-0">
            1
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Select Your Items</h2>
            <p className="text-aurora-muted">
              Browse our wide selection of fresh produce, groceries, and household essentials.
            </p>
          </div>
        </div>
        <div className="flex gap-6 items-start">
          <div className="w-16 h-16 rounded-full bg-aurora-accent/30 flex items-center justify-center text-2xl font-bold text-aurora-accent shrink-0">
            2
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">We Prepare Your Order</h2>
            <p className="text-aurora-muted">
              Our team carefully selects each item, ensuring only the freshest products make it to your basket.
            </p>
          </div>
        </div>
        <div className="flex gap-6 items-start">
          <div className="w-16 h-16 rounded-full bg-aurora-accent/30 flex items-center justify-center text-2xl font-bold text-aurora-accent shrink-0">
            3
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Delivery to Your Door</h2>
            <p className="text-aurora-muted">
              Receive your order at your preferred time, with our temperature-controlled delivery service.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-20">
        <InsightBlurb />
      </div>

      <div className="mt-16 p-8 rounded-component bg-aurora-accent/20 border border-aurora-accent/30 text-center">
        <h2 className="text-2xl font-bold mb-2">Ready to shop with us?</h2>
        <p className="text-aurora-muted mb-6">
          Experience the difference of truly fresh groceries delivered to your doorstep.
        </p>
        <Link
          href="/catalogue"
          className="inline-block px-8 py-4 rounded-component bg-aurora-accent text-aurora-bg font-bold hover:opacity-90"
        >
          Start Shopping
        </Link>
      </div>
    </div>
  );
}
