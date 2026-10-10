import type { CartData, CartItem, Unit } from "@/types";

export const CART_KEY = "cakeCart_v2";
export const CART_EVENT_NAME = "cake-cart-updated";

export const cartKey = (name: string, amount: number, unit: Unit) => `${name}|${amount}${unit}`;

export const loadCartData = (): CartData => {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "null");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const saveCartData = (data: CartData) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Could not save cart:", e);
  }
  window.dispatchEvent(new Event(CART_EVENT_NAME));
};

export const cartItems = (data: CartData): CartItem[] => Object.values(data).filter((i) => i.quantity > 0);
export const cartItemCount = (data: CartData) => cartItems(data).reduce((sum, i) => sum + i.quantity, 0);
export const cartTotal = (data: CartData) => cartItems(data).reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
