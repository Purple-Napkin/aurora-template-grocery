"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Package, ArrowLeft } from "lucide-react";
import { useAuth } from "aurora-starter-core";

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
      month: "long",
      year: "numeric",
    });
  } catch {
    return " - ";
  }
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, loading, token } = useAuth();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user || !token) return;
    setOrderLoading(true);
    setOrderError(null);
    fetch(`/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) return r.json().then((j) => Promise.reject(new Error(j.error ?? "Failed")));
        return r.json();
      })
      .then((data) => setOrder(data.data ?? null))
      .catch((e) => setOrderError(e instanceof Error ? e.message : "Failed to load order"))
      .finally(() => setOrderLoading(false));
  }, [id, user, token]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
        <p className="text-aurora-muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
        <p className="text-aurora-muted mb-6">Sign in to view this order.</p>
        <Link href="/auth/login?returnTo=/account/orders" className="text-aurora-accent hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  if (orderLoading || orderError || !order) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
        {orderError && <p className="text-red-400 mb-4">{orderError}</p>}
        {orderLoading && <p className="text-aurora-muted">Loading order…</p>}
        {!orderLoading && !order && !orderError && <p className="text-aurora-muted">Order not found.</p>}
        <Link href="/account/orders" className="inline-flex items-center gap-2 text-aurora-accent hover:underline mt-4">
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </Link>
      </div>
    );
  }

  const items = (order.items ?? []) as Array<{
    product_id?: string;
    quantity?: number;
    price?: number;
    name?: string;
  }>;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-aurora-muted hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to orders
      </Link>

      <h1 className="text-2xl font-bold mb-6">
        Order #{String(order.id).slice(-8)}
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 rounded-xl bg-aurora-surface border border-aurora-border">
          <h2 className="font-semibold mb-4">Details</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-aurora-muted">Date</dt>
              <dd>{formatDate(order.created_at as string)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-aurora-muted">Status</dt>
              <dd className="capitalize">{String(order.status ?? " - ")}</dd>
            </div>
            <div className="flex justify-between font-semibold pt-2">
              <dt>Total</dt>
              <dd className="text-aurora-accent">
                {formatPrice(Number(order.total) ?? 0)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="p-6 rounded-xl bg-aurora-surface border border-aurora-border">
          <h2 className="font-semibold mb-4">Items</h2>
          {items.length === 0 ? (
            <p className="text-aurora-muted text-sm">No items</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span>
                    {item.name ?? `Item ${i + 1}`} × {item.quantity ?? 1}
                  </span>
                  <span>{formatPrice(Number(item.price ?? 0) * (item.quantity ?? 1))}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
