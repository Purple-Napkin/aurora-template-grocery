"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, Trash2 } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { useStore } from "@/components/StoreContext";

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

const SHIPPING_CENTS = 250; // £2.50

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const { store } = useStore();
  const shipping = items.length > 0 ? SHIPPING_CENTS : 0;
  const grandTotal = total + shipping;

  const handleCheckout = () => {
    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Your Basket is empty</h1>
        <p className="text-aurora-muted mb-8">
          Add some products from the catalogue.
        </p>
        <Link
          href="/catalogue"
          className="inline-block px-6 py-3 rounded-component bg-aurora-accent text-aurora-bg font-medium hover:opacity-90"
        >
          View catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-2xl font-bold mb-6">Your Basket</h1>

      {store && (
        <div className="flex items-center justify-between p-4 rounded-component bg-aurora-surface/80 border border-aurora-border mb-6">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 shrink-0" />
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
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 rounded-component bg-aurora-surface border border-aurora-border"
              >
                <Link
                  href={`/catalogue/${item.recordId}`}
                  className="w-16 h-16 rounded-component bg-aurora-surface-hover shrink-0 overflow-hidden block hover:opacity-90 transition-opacity"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/catalogue/${item.recordId}`}
                    className="font-medium hover:text-aurora-accent transition-colors block"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-aurora-muted mt-0.5">
                    {formatPrice(item.unitAmount)}
                    {item.sellByWeight ? `/${item.unit || "kg"}` : ""} × {item.quantity}
                    {item.sellByWeight ? ` ${item.unit || "kg"}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
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
                    <Trash2 className="w-4 h-4 shrink-0" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div data-holmes="basket-bundle" className="mt-6" />
        </div>

        <div>
          <div className="p-4 rounded-component bg-aurora-surface border border-aurora-border sticky top-24">
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
            <button
              type="button"
              onClick={handleCheckout}
              className="w-full mt-4 py-4 rounded-component bg-aurora-accent text-aurora-bg font-bold hover:opacity-90"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
