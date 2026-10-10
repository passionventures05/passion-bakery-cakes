"use client";

import { useCallback, useEffect, useState } from "react";
import type { CartData, CartItem } from "@/types";
import {
  CART_EVENT_NAME,
  CART_KEY,
  cartItemCount,
  cartKey,
  loadCartData,
  saveCartData,
} from "./cart";

/** Shared localStorage-backed cart. One entry per cake + size. */
export function useCart() {
  const [cart, setCart] = useState<CartData>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setCart(loadCartData());
    sync();
    setReady(true);
    window.addEventListener(CART_EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  /** Set the quantity of an item; quantity <= 0 removes it. */
  const setItem = useCallback((item: Omit<CartItem, "quantity">, quantity: number) => {
    const data = loadCartData();
    const key = cartKey(item.name, item.amount, item.unit);
    if (quantity > 0) data[key] = { ...item, quantity };
    else delete data[key];
    saveCartData(data);
    setCart(data);
  }, []);

  const removeKey = useCallback((key: string) => {
    const data = loadCartData();
    delete data[key];
    saveCartData(data);
    setCart(data);
  }, []);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(CART_KEY);
    } catch {}
    window.dispatchEvent(new Event(CART_EVENT_NAME));
    setCart({});
  }, []);

  return { cart, ready, count: cartItemCount(cart), setItem, removeKey, clear };
}
