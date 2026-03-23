"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@aurora-studio/starter-core";
import { useStore } from "@aurora-studio/starter-core";
import { BasketBundlePlaceholder } from "@/components/BasketBundlePlaceholder";
import { HolmesContextualWell } from "@/components/HolmesContextualWell";
import { RecipePicker } from "@/components/RecipePicker";
import { HolmesTidbits } from "@aurora-studio/starter-core";
import { ProductImage } from "@aurora-studio/starter-core";
import { SubstituteButton } from "@/components/SubstituteButton";
import { CompleteYourMeal } from "@/components/CompleteYourMeal";
import { ForgotSuggestions } from "@/components/ForgotSuggestions";
import { BasketCompositionSummary } from "@/components/BasketCompositionSummary";
import { ReorderLastShop } from "@/components/ReorderLastShop";
import { BasketSaverTips } from "@/components/BasketSaverTips";
import { ClientStoreContentRail } from "@/components/ClientStoreContentRail";
import { CartTonightRecipes } from "@/components/CartTonightRecipes";
import { useMissionAware } from "@/components/MissionAwareHome";
import { ShoppingListTemplates } from "@/components/ShoppingListTemplates";
import { CartMissionHeader } from "@/components/cart/CartMissionHeader";
import { isCookingMissionKey, isTravelLikeMission } from "@/lib/intent-mission";

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

const SHIPPING_CENTS = 250; // £2.50
const FREE_DELIVERY_THRESHOLD_CENTS = 2500; // £25

export default function CartPageClient() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const { store } = useStore();
  const missionData = useMissionAware();
  const shipping = items.length > 0 ? SHIPPING_CENTS : 0;
  const grandTotal = total + shipping;
  const toFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD_CENTS - total);

  const band = missionData?.activeMission?.band;
  const missionKey = missionData?.activeMission?.key;
  const highMission = band === "high";
  const travelHigh = highMission && isTravelLikeMission(missionKey);
  const cookingHigh = highMission && isCookingMissionKey(missionKey);

  const suppressRecipeUpsells = travelHigh;
  const suppressSecondaryNoise = highMission;

  const handleCheckout = () => {
    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center">
        <span className="text-5xl mb-4 block" aria-hidden>
          🛒
        </span>
        <h1 className="text-2xl font-bold mb-2">Your basket is empty</h1>
        <p className="text-aurora-muted mb-8">
          Nothing in here yet — start a mission from the homepage or browse the catalogue.
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

  const itemNames = items.map((i) => i.name);

  return (
    <div className="max-w-6xl mx-auto py-10 sm:py-12 px-4 sm:px-6">
      <CartMissionHeader itemNames={itemNames} />
      <BasketCompositionSummary items={items} />

      {store && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-aurora-surface/80 border border-aurora-border mb-6">
          <div className="flex items-center gap-2 min-w-0">
            <span aria-hidden>🏪</span>
            <span className="text-sm truncate">Shopping from: {store.name}</span>
            <Link href="/stores" className="text-aurora-accent hover:underline text-sm shrink-0">
              Details
            </Link>
          </div>
          <Link
            href="/stores"
            className="text-sm font-medium text-aurora-accent hover:underline shrink-0"
          >
            Change store
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_minmax(280px,360px)] gap-8 lg:gap-10 items-start">
        <div className="min-w-0 order-2 lg:order-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-aurora-text">
              Items ({items.length})
            </h2>
            <button
              type="button"
              onClick={clearCart}
              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-sm"
            >
              Clear basket
            </button>
          </div>
          <div className="space-y-3 mb-8">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap sm:flex-nowrap gap-4 p-4 rounded-xl bg-aurora-surface border border-aurora-border shadow-sm"
              >
                <Link
                  href={`/catalogue/${item.recordId}`}
                  className="w-16 h-16 rounded-lg bg-aurora-surface-hover shrink-0 overflow-hidden block hover:opacity-90 transition-opacity"
                >
                  <ProductImage
                    src={item.imageUrl}
                    className="w-full h-full"
                    thumbnail
                    fallback={
                      <span className="w-full h-full flex items-center justify-center text-aurora-muted text-xs">
                        -
                      </span>
                    }
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
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-end">
                  <SubstituteButton item={item} />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg border border-aurora-border hover:bg-aurora-surface-hover"
                    >
                      −
                    </button>
                    <span className="w-8 text-center tabular-nums">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg border border-aurora-border hover:bg-aurora-surface-hover"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-600 dark:text-red-400 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <HolmesContextualWell variant="cart" />

          {(travelHigh || highMission) && <ShoppingListTemplates />}

          <div id="basket-bundle" className="mb-6 scroll-mt-24">
            <p className="text-xs font-semibold text-aurora-muted uppercase tracking-widest mb-2">
              One-tap completion
            </p>
            <div data-holmes="basket-bundle" className="min-h-[1px]" />
            <BasketBundlePlaceholder />
          </div>

          {!suppressRecipeUpsells && <CompleteYourMeal />}

          {cookingHigh ? (
            <details className="mb-6 group rounded-xl border border-aurora-border bg-aurora-surface/50 open:bg-aurora-surface">
              <summary className="cursor-pointer list-none px-4 py-3 font-medium text-sm text-aurora-text flex items-center justify-between">
                <span>More meal ideas (optional)</span>
                <span className="text-aurora-muted text-xs group-open:rotate-180 transition-transform">
                  ▾
                </span>
              </summary>
              <div className="px-4 pb-4 pt-0 border-t border-aurora-border/60">
                <RecipePicker />
              </div>
            </details>
          ) : !suppressRecipeUpsells ? (
            <RecipePicker />
          ) : null}

          {!suppressSecondaryNoise && items[0] && (
            <div className="mb-6">
              <HolmesTidbits entity={items[0].recordId} entityType="product" />
            </div>
          )}
          {!suppressSecondaryNoise && (
            <>
              <ReorderLastShop />
              <BasketSaverTips />
            </>
          )}

          <CartTonightRecipes />
          <ClientStoreContentRail
            contentPage="cart"
            contentRegion="cart_below_bundle"
            className="mb-8"
          />
          {!travelHigh && <ForgotSuggestions />}
        </div>

        <div className="order-1 lg:order-2 lg:sticky lg:top-24">
          <div className="pattern-well p-5 rounded-2xl border border-aurora-border shadow-md">
            <h2 className="font-display font-semibold text-lg mb-4 text-aurora-text">Order summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-aurora-muted">Subtotal</span>
                <span className="tabular-nums">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-aurora-muted">Delivery</span>
                <span className="tabular-nums">{formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-3 border-t border-aurora-border">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(grandTotal)}</span>
              </div>
              {toFreeDelivery > 0 && (
                <p className="mt-3 rounded-lg bg-aurora-primary/10 px-3 py-2 text-xs text-aurora-primary leading-snug">
                  {toFreeDelivery <= 1000
                    ? `Add ${formatPrice(toFreeDelivery)} more for free delivery.`
                    : `${formatPrice(toFreeDelivery)} until free delivery.`}
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-4" data-holmes="cross-sell">
              <input
                type="text"
                placeholder="Promo code"
                className="flex-1 px-3 py-2 rounded-lg bg-aurora-bg border border-aurora-border text-aurora-text placeholder:text-aurora-muted text-sm"
              />
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-aurora-border hover:bg-aurora-surface-hover text-sm"
              >
                Apply
              </button>
            </div>
            <div
              data-holmes="payment"
              className="[&_button]:outline-none [&_button]:ring-0 [&_button]:focus:ring-0 [&_button]:focus:ring-offset-0 [&_a]:outline-none [&_a]:ring-0"
            >
              <button
                type="button"
                onClick={handleCheckout}
                className="checkout-btn w-full mt-4 py-3.5 sm:py-4 rounded-xl bg-aurora-accent text-white font-bold hover:opacity-95 transition-opacity shadow-sm"
              >
                Proceed to checkout
              </button>
            </div>
            {highMission && (
              <p className="text-xs text-aurora-muted mt-3 text-center">
                Checkout is prioritised — fewer distractions on purpose.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
