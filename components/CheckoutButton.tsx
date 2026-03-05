"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

export function CheckoutButton() {
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const successUrl = `${origin}/checkout/success`;
    const cancelUrl = `${origin}/cart`;

    const lineItems = items.map((i) => ({
      productId: i.recordId,
      tableSlug: i.tableSlug,
      quantity: i.quantity,
      priceData: {
        unitAmount: i.unitAmount,
        currency: "GBP",
        productData: { name: i.name },
      },
    }));

    const holmes_session_id =
      typeof window !== "undefined" ? window.holmes?.getSessionId?.() : undefined;

    try {
      const res = await fetch("/api/checkout/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          successUrl,
          cancelUrl,
          lineItems,
          ...(holmes_session_id && { holmes_session_id }),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Checkout failed");
      }

      const data = (await res.json()) as { url?: string };
      if (data.url) {
        clearCart();
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading || items.length === 0}
      className="px-6 py-3 rounded-component bg-aurora-accent text-aurora-bg font-semibold hover:opacity-90 disabled:opacity-50"
    >
      {loading ? "Processing…" : "Proceed to checkout"}
    </button>
  );
}
