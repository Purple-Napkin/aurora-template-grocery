"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./CartProvider";
import { useAddToCartFly } from "./AddToCartFly";
import { formatPrice } from "@/lib/format-price";
import { useState, useRef, useEffect } from "react";

export function CartLink() {
  const { items, total } = useCart();
  const flyCtx = useAddToCartFly();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    flyCtx?.setCartRef(linkRef.current);
    return () => flyCtx?.setCartRef(null);
  }, [flyCtx]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        ref={linkRef}
        href="/cart"
        className="flex items-center gap-2 text-sm text-aurora-muted hover:text-aurora-text transition-colors font-medium"
      >
        <ShoppingCart className="w-5 h-5 shrink-0" />
        <span>Cart</span>
        {count > 0 && (
          <span
            key={count}
            className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-2 rounded-full bg-aurora-primary text-white text-xs font-semibold cart-badge"
          >
            {count}
          </span>
        )}
      </Link>
      {open && count > 0 && (
        <div className="absolute top-full right-0 mt-1 pt-1 z-[200]">
          <div className="rounded-xl bg-aurora-surface border border-aurora-border shadow-xl w-80 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-aurora-border">
              <p className="font-semibold text-sm">
                {count} {count === 1 ? "item" : "items"}
              </p>
              <p className="text-lg font-bold text-aurora-primary mt-0.5">
                {formatPrice(total)}
              </p>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {items.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 border-b border-aurora-border last:border-0"
                >
                  <div className="w-12 h-12 rounded-lg bg-aurora-surface-hover shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-aurora-muted text-lg">
                        —
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-aurora-muted">
                      {formatPrice(item.unitAmount)} × {item.quantity}
                      {item.sellByWeight ? ` ${item.unit || "kg"}` : ""}
                    </p>
                  </div>
                </div>
              ))}
              {items.length > 5 && (
                <p className="text-xs text-aurora-muted p-3 text-center">
                  +{items.length - 5} more
                </p>
              )}
            </div>
            <div className="p-4">
              <Link
                href="/cart"
                onClick={() => setOpen(false)}
                className="block w-full py-3 rounded-xl bg-aurora-primary text-white text-center font-semibold hover:bg-aurora-primary-dark transition-colors"
              >
                View cart · Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
