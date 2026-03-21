"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "aurora-starter-core";
import { useStore } from "aurora-starter-core";
import { BasketBundlePlaceholder } from "@/components/BasketBundlePlaceholder";
import { HolmesContextualWell } from "@/components/HolmesContextualWell";
import { RecipePicker } from "@/components/RecipePicker";
import { HolmesTidbits } from "aurora-starter-core";
import { ProductImage } from "aurora-starter-core";
import { SubstituteButton } from "@/components/SubstituteButton";
import { CompleteYourMeal } from "@/components/CompleteYourMeal";
import { ForgotSuggestions } from "@/components/ForgotSuggestions";
import { BasketCompositionSummary } from "@/components/BasketCompositionSummary";
import { ReorderLastShop } from "@/components/ReorderLastShop";
import { BasketSaverTips } from "@/components/BasketSaverTips";

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

const SHIPPING_CENTS = 250; // £2.50
const FREE_DELIVERY_THRESHOLD_CENTS = 2500; // £25

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const { store } = useStore();
  const shipping = items.length > 0 ? SHIPPING_CENTS : 0;
  const grandTotal = total + shipping;
  const toFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD_CENTS - total);

  const handleCheckout = () => {
    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center">
        <span className="text-5xl mb-4 block" aria-hidden>🛒</span>
        <h1 className="text-2xl font-bold mb-2">Your basket is empty</h1>
        <p className="text-aurora-muted mb-8">
          Nothing in here yet – but we&apos;ve got plenty of good stuff waiting for you!
        </p>
        <Link
          href="/catalogue"
          className="inline-block px-6 py-3 rounded-component bg-aurora-accent text-aurora-bg font-medium hover:opacity-90"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-2xl font-bold mb-2">Your Basket</h1>
      <BasketCompositionSummary items={items} />

      {store && (
        <div className="flex items-center justify-between p-4 rounded-component bg-aurora-surface/80 border border-aurora-border mb-6">
          <div className="flex items-center gap-2">
            <span>🏪</span>
            <span className="text-sm">Shopping from: {store.name}</span>
            <Link href="/stores" className="text-aurora-accent hover:underline text-sm ml-1">
              View Store Details
            </Link>
          </div>
          <Link
            href="/stores"
            className="text-sm font-medium text-aurora-accent hover:underline"
          >
            Change Store
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Items ({items.length})</h2>
            <button
              type="button"
              onClick={clearCart}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Clear Basket
            </button>
          </div>
          <div className="space-y-4 mb-8">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 rounded-component bg-aurora-surface border border-aurora-border"
              >
                <Link
                  href={`/catalogue/${item.recordId}`}
                  className="w-16 h-16 rounded-component bg-aurora-surface-hover shrink-0 overflow-hidden block hover:opacity-90 transition-opacity"
                >
                  <ProductImage
                    src={item.imageUrl}
                    className="w-full h-full"
                    objectFit="contain"
                    thumbnail
                    fallback={<span className="w-full h-full flex items-center justify-center text-aurora-muted text-xs">-</span>}
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/catalogue/${item.recordId}`}
                    className="font-medium hover:text-aurora-primary transition-colors block"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-aurora-muted">
                    {formatPrice(item.unitAmount)}
                    {item.sellByWeight ? `/${item.unit || "kg"}` : ""} × {item.quantity}
                    {item.sellByWeight ? ` ${item.unit || "kg"}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <SubstituteButton item={item} />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-component border border-aurora-border hover:bg-aurora-surface-hover"
                    >
                      −
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-component border border-aurora-border hover:bg-aurora-surface-hover"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                  >
                    🗑 Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <HolmesContextualWell variant="cart" />
          {items[0] && (
            <div className="mb-6">
              <HolmesTidbits
                entity={items[0].recordId}
                entityType="product"
              />
            </div>
          )}
          <ReorderLastShop />
          <BasketSaverTips />
          <RecipePicker />
          <CompleteYourMeal />
          {/* Holmes injects bundle here when mission confidence >= 0.5; skeleton hides when inject happens or after ~3s */}
          <div id="basket-bundle" className="mb-6">
            <div data-holmes="basket-bundle" className="min-h-[1px]" />
            <BasketBundlePlaceholder />
          </div>
          <ForgotSuggestions />
        </div>

        <div>
          <div className="pattern-well p-4 rounded-component border border-aurora-border sticky top-24">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-aurora-muted">Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-aurora-muted">Shipping (Delivery)</span>
                <span>{formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-aurora-border">
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
              {toFreeDelivery > 0 && toFreeDelivery <= 1000 && (
                <p className="mt-3 rounded-lg bg-aurora-primary/10 px-3 py-2 text-xs text-aurora-primary">
                  Add {formatPrice(toFreeDelivery)} more for free delivery – you&apos;re so close! 🎉
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-4" data-holmes="cross-sell">
              <input
                type="text"
                placeholder="Promo code"
                className="flex-1 px-3 py-2 rounded-component bg-aurora-bg border border-aurora-border text-white placeholder:text-aurora-muted text-sm"
              />
              <button
                type="button"
                className="px-4 py-2 rounded-component border border-aurora-border hover:bg-aurora-surface-hover text-sm"
              >
                Apply
              </button>
            </div>
            <div data-holmes="payment" className="[&_button]:outline-none [&_button]:ring-0 [&_button]:focus:ring-0 [&_button]:focus:ring-offset-0 [&_a]:outline-none [&_a]:ring-0">
              <button
                type="button"
                onClick={handleCheckout}
                className="checkout-btn w-full mt-4 py-3 sm:py-4 rounded-component bg-aurora-accent text-aurora-bg font-bold hover:opacity-90 transition-opacity"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
