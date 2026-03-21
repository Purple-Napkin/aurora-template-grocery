"use client";

import { useState, useEffect } from "react";
import { useAuth } from "aurora-starter-core";
import { useCart } from "aurora-starter-core";
import { getStoreConfig } from "aurora-starter-core";

interface OrderItem {
  product_id?: string;
  quantity?: number;
  price?: number;
  unit_price?: number;
  name?: string;
}

interface Order {
  id: string;
  items?: OrderItem[];
  [key: string]: unknown;
}

/** "Your usual shop" - Quick reorder from last order for logged-in users. */
export function ReorderLastShop() {
  const { user, token } = useAuth();
  const { addItem } = useCart();
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [catalogSlug, setCatalogSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !token) return;
    fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data) => {
        const orders = (data?.data ?? []) as Order[];
        const sorted = orders.sort(
          (a, b) =>
            new Date(String(b.created_at ?? 0)).getTime() -
            new Date(String(a.created_at ?? 0)).getTime()
        );
        const mostRecent = sorted[0];
        if (!mostRecent?.id) return;
        const detailRes = await fetch(`/api/orders/${mostRecent.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!detailRes.ok) return;
        const detail = await detailRes.json();
        const orderWithItems = detail?.data ?? null;
        if (orderWithItems?.items?.length) setLastOrder(orderWithItems);
      })
      .catch(() => {});
  }, [user, token]);

  useEffect(() => {
    getStoreConfig().then((c) => {
      const slug = (c as { catalogTableSlug?: string })?.catalogTableSlug;
      if (slug) setCatalogSlug(slug);
    });
  }, []);

  const handleReorder = () => {
    if (!lastOrder?.items?.length || !catalogSlug) return;
    setLoading(true);
    for (const item of lastOrder.items) {
      const unitPrice = item.price ?? item.unit_price;
      if (item.product_id && item.name && unitPrice != null && Number(unitPrice) > 0) {
        addItem({
          recordId: item.product_id,
          tableSlug: catalogSlug,
          name: item.name,
          unitAmount: Math.round(Number(unitPrice) * 100),
          quantity: item.quantity ?? 1,
        });
      }
    }
    setLoading(false);
  };

  if (!lastOrder?.items?.length || !catalogSlug) return null;

  const itemCount = lastOrder.items.length;

  return (
    <div className="mb-6 p-4 rounded-xl bg-aurora-surface border border-aurora-primary/30">
      <h3 className="font-semibold mb-1">Quick reorder</h3>
      <p className="text-sm text-aurora-muted mb-3">
        Add your last order ({itemCount} items) to the basket
      </p>
      <button
        type="button"
        onClick={handleReorder}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-aurora-primary text-white text-sm font-semibold hover:bg-aurora-primary-dark transition-colors disabled:opacity-50"
      >
        {loading ? "Adding…" : "Add all"}
      </button>
    </div>
  );
}
