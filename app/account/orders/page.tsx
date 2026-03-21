"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { useAuth } from "@aurora-studio/starter-core";

interface OrderRecord {
  id: string;
  status?: string;
  total?: number;
  created_at?: string;
  [key: string]: unknown;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format((cents ?? 0) / 100);
}

function formatDate(iso: string | undefined): string {
  if (!iso) return " - ";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return " - ";
  }
}

export default function OrdersPage() {
  const { user, loading, token } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) return;
    setOrdersLoading(true);
    setOrdersError(null);
    fetch("/api/orders", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) return r.json().then((j) => Promise.reject(new Error(j.error ?? "Failed")));
        return r.json();
      })
      .then((data) => setOrders(data.data ?? []))
      .catch((e) => setOrdersError(e instanceof Error ? e.message : "Failed to load orders"))
      .finally(() => setOrdersLoading(false));
  }, [user, token]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
        <h1 className="text-2xl font-bold mb-6">Orders</h1>
        <p className="text-aurora-muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
        <h1 className="text-2xl font-bold mb-6">Orders</h1>
        <p className="text-aurora-muted mb-6">Sign in to view your order history.</p>
        <Link
          href="/auth/login?returnTo=/account/orders"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-component bg-aurora-accent text-aurora-bg font-medium hover:opacity-90"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

      {ordersLoading ? (
        <p className="text-aurora-muted">Loading orders…</p>
      ) : ordersError ? (
        <p className="text-red-400 mb-4">{ordersError}</p>
      ) : orders.length === 0 ? (
        <p className="text-aurora-muted mb-6">
          Your order history will appear here once you complete a purchase.
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="block p-4 rounded-xl bg-aurora-surface border border-aurora-border hover:border-aurora-accent/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-aurora-muted shrink-0" />
                  <div>
                    <p className="font-medium">Order #{String(order.id).slice(-8)}</p>
                    <p className="text-sm text-aurora-muted">
                      {formatDate(order.created_at as string)} · {String(order.status ?? " - ")}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-aurora-accent">
                  {formatPrice(Number(order.total) ?? 0)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
