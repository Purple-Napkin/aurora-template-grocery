"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useAuth } from "@aurora-studio/starter-core";
import { useCart } from "@aurora-studio/starter-core";

interface OrderItem {
  product_id?: string;
  quantity?: number;
  price?: number;
  name?: string;
  table_slug?: string;
}

/** Buy Again - reorder from last order. Shown on cart page. */
export function BuyAgainSection() {
  const { user, token } = useAuth();
  const { addItem } = useCart();
  const [lastOrderItems, setLastOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !token) return;
    setLoading(true);
    fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))))
      .then((data) => {
        const orders = data.data ?? [];
        const last = orders[0];
        if (!last?.id) return;
        return fetch(`/api/orders/${last.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((r) => (r?.ok ? r.json() : null))
      .then((data) => {
        const order = data?.data;
        const items = (order?.items ?? []) as OrderItem[];
        setLastOrderItems(items.filter((i) => i.product_id && i.name));
      })
      .catch(() => setLastOrderItems([]))
      .finally(() => setLoading(false));
  }, [user, token]);

  if (loading) return null;
  if (lastOrderItems.length === 0) return null;

  const handleReorderAll = () => {
    const tableSlug = "products";
    for (const item of lastOrderItems) {
      if (item.product_id && item.name && item.price != null) {
        const p = Number(item.price);
        const unitAmount = p >= 1000 ? Math.round(p) : Math.round(p * 100);
        addItem({
          recordId: item.product_id,
          tableSlug: item.table_slug ?? tableSlug,
          name: item.name,
          unitAmount,
          quantity: item.quantity ?? 1,
        });
      }
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-aurora-border">
      <h2 className="font-semibold mb-3 flex items-center gap-2">
        <RotateCcw className="w-4 h-4" />
        Buy Again
      </h2>
      <p className="text-sm text-aurora-muted mb-3">
        From your last order
      </p>
      <button
        type="button"
        onClick={handleReorderAll}
        className="w-full py-2.5 rounded-component border border-aurora-primary text-aurora-primary font-medium hover:bg-aurora-primary/10 transition-colors"
      >
        Add all {lastOrderItems.length} items to basket
      </button>
      <Link
        href="/account/orders"
        className="block text-center text-sm text-aurora-muted hover:text-aurora-text mt-2"
      >
        View order history
      </Link>
    </div>
  );
}
