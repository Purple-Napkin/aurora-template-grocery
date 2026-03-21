"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "aurora-starter-core";
import { useStore } from "aurora-starter-core";
import {
  createCheckoutSession,
  getDeliverySlots,
  type DeliverySlot,
} from "aurora-starter-core";

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

const SHIPPING_CENTS = 250;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PREFER_ORGANIC_KEY = "aurora-prefer-organic";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const { location, store } = useStore();
  const [step, setStep] = useState(1);
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [instructions, setInstructions] = useState("");
  const [allowSubstitutions, setAllowSubstitutions] = useState(true);
  const [preferOrganic, setPreferOrganic] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const shipping = items.length > 0 ? SHIPPING_CENTS : 0;
  const grandTotal = total + shipping;

  useEffect(() => {
    if (location) {
      getDeliverySlots(location.lat, location.lng)
        .then((r) => setSlots(r.data ?? []))
        .catch(() => setSlots([]));
    } else {
      setSlots([]);
    }
  }, [location]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFER_ORGANIC_KEY);
      if (stored === "true") setPreferOrganic(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PREFER_ORGANIC_KEY, String(preferOrganic));
    } catch {
      /* ignore */
    }
  }, [preferOrganic]);

  const handlePayment = async () => {
    if (!termsAccepted) {
      alert("Please accept the Terms of Service");
      return;
    }
    setLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const holmes_session_id =
        typeof window !== "undefined" ? window.holmes?.getSessionId?.() : undefined;
      const holmes_mission_start_timestamp =
        typeof window !== "undefined" ? window.holmes?.getMissionStartTimestamp?.() : undefined;

      const res = await fetch("/api/checkout/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          successUrl: `${origin}/checkout/success`,
          cancelUrl: `${origin}/cart`,
          lineItems: items.map((i) => ({
            productId: i.recordId,
            tableSlug: i.tableSlug,
            quantity: i.quantity,
            sellByWeight: i.sellByWeight,
            priceData: {
              unitAmount: i.unitAmount,
              currency: "GBP",
              productData: { name: i.name },
            },
          })),
          deliverySlotId: selectedSlotId ?? undefined,
          ...(holmes_session_id && { holmes_session_id }),
          ...(holmes_mission_start_timestamp != null && {
            holmes_mission_start_timestamp: holmes_mission_start_timestamp,
          }),
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

  if (items.length === 0 && step < 3) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Your basket is empty</h1>
        <Link
          href="/catalogue"
          className="inline-block px-6 py-3 rounded-component bg-aurora-accent text-aurora-bg font-medium"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      {store && (
        <div className="flex items-center justify-between mb-6">
          <span className="text-aurora-muted">Checkout from: {store.name}</span>
          <Link href="/stores" className="text-aurora-accent hover:underline text-sm">
            Change Store
          </Link>
        </div>
      )}

      <div className="flex gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex items-center gap-2 ${
              step >= s ? "text-aurora-accent" : "text-aurora-muted"
            }`}
          >
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > s ? "bg-aurora-accent text-aurora-bg" : step === s ? "bg-aurora-accent/30" : "bg-aurora-surface"
              }`}
            >
              {step > s ? "✓" : s}
            </span>
            <span className="hidden sm:inline">
              {s === 1 && "Shipping & Delivery"}
              {s === 2 && "Delivery Details"}
              {s === 3 && "Payment"}
            </span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <>
              <div>
                <h2 className="font-semibold mb-2">Delivery Address</h2>
                {location && (
                  <div className="p-4 rounded-component bg-aurora-surface border border-aurora-border mb-4">
                    <p className="text-sm flex items-center gap-2">
                      <span>📍</span> {location.address ?? `Lat: ${location.lat}, Lng: ${location.lng}`}
                    </p>
                    <p className="text-aurora-muted text-xs mt-1">
                      Move the map to position the pin at your delivery location.
                    </p>
                  </div>
                )}
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Or enter address manually"
                  className="w-full px-4 py-3 rounded-component bg-aurora-surface border border-aurora-border text-white"
                />
              </div>
              <div>
                <h2 className="font-semibold mb-2">Delivery Slot</h2>
                {slots.length === 0 ? (
                  <p className="text-aurora-muted text-sm">
                    {location
                      ? "No slots available. Proceed to continue."
                      : "Set your location to see delivery slots."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {slots.map((slot) => (
                      <label
                        key={slot.id}
                        className={`flex items-center gap-3 p-3 rounded-component border cursor-pointer ${
                          selectedSlotId === slot.id
                            ? "border-aurora-accent bg-aurora-accent/10"
                            : "border-aurora-border"
                        }`}
                      >
                        <input
                          type="radio"
                          name="slot"
                          checked={selectedSlotId === slot.id}
                          onChange={() => setSelectedSlotId(slot.id)}
                        />
                        <span>
                          {DAYS[slot.day_of_week]} {slot.start_time}-{slot.end_time}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block font-medium mb-2">Mobile number *</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="We'll only contact you about your delivery"
                  className="w-full px-4 py-3 rounded-component bg-aurora-surface border border-aurora-border text-white"
                />
              </div>
              <div data-holmes="checkout-extras">
                <label className="block font-medium mb-2">Delivery instructions (optional)</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Leave with neighbor, place at back door"
                  rows={3}
                  className="w-full px-4 py-3 rounded-component bg-aurora-surface border border-aurora-border text-white"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer" data-holmes="checkout-extras">
                <input
                  type="checkbox"
                  checked={allowSubstitutions}
                  onChange={(e) => setAllowSubstitutions(e.target.checked)}
                  className="rounded"
                />
                <span>Allow product substitutions if items are unavailable</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer" data-holmes="checkout-extras">
                <input
                  type="checkbox"
                  checked={preferOrganic}
                  onChange={(e) => setPreferOrganic(e.target.checked)}
                  className="rounded"
                />
                <span>Prefer organic when available</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="rounded"
                />
                <span>
                  I accept the <Link href="/about" className="text-aurora-accent">Terms of Service</Link>
                </span>
              </label>
            </>
          )}

          {step === 3 && (
            <div data-holmes="payment" className="p-4 rounded-component bg-aurora-surface border border-aurora-border">
              <p className="text-aurora-muted">
                You will be redirected to complete payment securely.
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="p-4 rounded-component bg-aurora-surface border border-aurora-border sticky top-24">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between text-sm gap-2">
                  <Link
                    href={`/catalogue/${i.recordId}`}
                    className="truncate max-w-[180px] hover:text-aurora-primary transition-colors"
                  >
                    {i.name} {i.sellByWeight ? `× ${i.quantity} ${i.unit || "kg"}` : `x${i.quantity}`}
                  </Link>
                  <span className="shrink-0">{formatPrice(i.unitAmount * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-aurora-border mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-aurora-muted">Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-aurora-muted">Shipping (Delivery)</span>
                <span>{formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-3 rounded-component border border-aurora-border hover:bg-aurora-surface-hover focus:outline-none focus:ring-2 focus:ring-aurora-primary/50"
                >
                  Back
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="flex-1 py-3 rounded-component bg-aurora-accent text-aurora-bg font-bold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-aurora-primary focus:ring-offset-2 focus:ring-offset-aurora-surface"
                >
                  {step === 2 ? "Proceed to Payment" : "Continue"}
                </button>
              ) : (
                <div data-holmes="payment" className="flex-1 min-w-0 [&_button]:outline-none [&_button]:ring-0 [&_button]:border-0">
                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full py-3 sm:py-4 rounded-component bg-aurora-accent text-aurora-bg font-bold disabled:opacity-50 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-aurora-primary focus:ring-offset-2 focus:ring-offset-aurora-surface transition-opacity"
                  >
                    {loading ? "Processing…" : "Place order"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
