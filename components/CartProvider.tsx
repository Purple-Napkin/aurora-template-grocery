"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { holmesCartUpdate } from "@/lib/holmes-events";

export interface CartItem {
  id: string;
  recordId: string;
  tableSlug: string;
  name: string;
  unitAmount: number;
  quantity: number;
  /** Variable-weight product: quantity is weight, unit is display unit */
  sellByWeight?: boolean;
  unit?: string;
  /** Product image URL for basket display */
  imageUrl?: string | null;
}

const CART_KEY = "aurora-cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveCart(items);
  }, [items, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const holmesItems = items.map((i) => ({
      id: i.recordId,
      name: i.name,
      price: i.unitAmount,
    }));
    holmesCartUpdate(count, holmesItems);
  }, [items, mounted]);

  const addItem = useCallback((item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => {
    const qty = item.quantity ?? 1;
    const cartId = `${item.tableSlug}:${item.recordId}`;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === cartId);
      if (existing && existing.sellByWeight === item.sellByWeight) {
        return prev.map((i) =>
          i.id === cartId ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { ...item, id: cartId, recordId: item.recordId, quantity: qty }];
    });
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handler = (e: Event) => {
      const d = (e as CustomEvent<{ products: Array<{ id: string; name: string; price: number; image?: string }>; tableSlug: string }>).detail;
      if (!d?.products?.length || !d.tableSlug) return;
      for (const p of d.products) {
        addItem({
          recordId: p.id,
          tableSlug: d.tableSlug,
          name: p.name,
          unitAmount: p.price,
          imageUrl: p.image,
        });
      }
    };
    document.addEventListener("holmes:addBundle", handler);
    return () => document.removeEventListener("holmes:addBundle", handler);
  }, [addItem, mounted]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + i.unitAmount * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
