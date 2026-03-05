"use client";

import { createContext, useContext, useCallback, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface FlyState {
  imageUrl: string | null;
  fromRect: DOMRect | null;
  toRect: DOMRect | null;
  key: number;
}

const AddToCartFlyContext = createContext<{
  triggerFly: (imageUrl: string | null, fromRect: DOMRect) => void;
  setCartRef: (el: HTMLAnchorElement | null) => void;
} | null>(null);

export function useAddToCartFly() {
  const ctx = useContext(AddToCartFlyContext);
  return ctx;
}

export function AddToCartFlyProvider({ children }: { children: React.ReactNode }) {
  const [fly, setFly] = useState<FlyState | null>(null);
  const cartRef = useRef<HTMLAnchorElement | null>(null);

  const setCartRef = useCallback((el: HTMLAnchorElement | null) => {
    cartRef.current = el;
  }, []);

  const triggerFly = useCallback((imageUrl: string | null, fromRect: DOMRect) => {
    const toRect = cartRef.current?.getBoundingClientRect() ?? new DOMRect(0, 0, 0, 0);
    setFly({ imageUrl, fromRect, toRect, key: Date.now() });
  }, []);

  useEffect(() => {
    if (!fly) return;
    const t = setTimeout(() => setFly(null), 500);
    return () => clearTimeout(t);
  }, [fly]);

  return (
    <AddToCartFlyContext.Provider value={{ triggerFly, setCartRef }}>
      {children}
      {fly && typeof window !== "undefined" && createPortal(
        <div
          key={fly.key}
          className="add-to-cart-fly fixed inset-0 pointer-events-none z-[99999]"
          aria-hidden
        >
          <div
            className="add-to-cart-fly-img absolute w-12 h-12 rounded-xl overflow-hidden bg-aurora-surface border-2 border-aurora-primary shadow-lg"
            style={{
              ["--fly-from-x" as string]: `${(fly.fromRect?.left ?? 0) + (fly.fromRect?.width ?? 0) / 2 - 24}px`,
              ["--fly-from-y" as string]: `${(fly.fromRect?.top ?? 0) + (fly.fromRect?.height ?? 0) / 2 - 24}px`,
              ["--fly-to-x" as string]: `${(fly.toRect?.left ?? 0) + (fly.toRect?.width ?? 0) / 2 - 24}px`,
              ["--fly-to-y" as string]: `${(fly.toRect?.top ?? 0) + (fly.toRect?.height ?? 0) / 2 - 24}px`,
              animation: "add-to-cart-fly 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
            }}
          >
            {fly.imageUrl ? (
              <img src={fly.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-aurora-primary text-lg">+</div>
            )}
          </div>
        </div>,
        document.body
      )}
    </AddToCartFlyContext.Provider>
  );
}
