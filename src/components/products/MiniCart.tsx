"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { cartItems, cartKey, cartTotal } from "@/lib/cart";
import { formatRupees } from "@/lib/format";
import type { CartData, CartItem } from "@/types";

interface Props {
  message: string;
  cart: CartData;
  images: Record<string, string>;
  onSetItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  onClose: () => void;
}

const FOCUSABLE = 'button:not([disabled]), a[href], input, select, [tabindex]:not([tabindex="-1"])';

/** Slide-out cart that appears when something is added, so people see it landed and can check out in one tap. */
export default function MiniCart({ message, cart, images, onSetItem, onClose }: Props) {
  const [show, setShow] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<Element | null>(null);
  const items = cartItems(cart);

  useEffect(() => {
    openerRef.current = document.activeElement;
    const id = requestAnimationFrame(() => setShow(true));
    return () => {
      cancelAnimationFrame(id);
      (openerRef.current as HTMLElement | null)?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (!show) return;
    const id = window.setTimeout(() => closeRef.current?.focus(), 60);
    return () => clearTimeout(id);
  }, [show]);

  const close = useCallback(() => {
    setShow(false);
    window.setTimeout(onClose, 380);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close();
      if (e.key !== "Tab" || !panelRef.current) return;
      const els = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div className={show ? "lx-drawer-overlay show" : "lx-drawer-overlay"} onClick={(e) => e.target === e.currentTarget && close()}>
      <aside className="lx-drawer" role="dialog" aria-modal="true" aria-label="Your cart" ref={panelRef}>
        <div className="lx-drawer-head">
          <h2>Your Cart</h2>
          <button type="button" className="lx-drawer-close" aria-label="Close cart" onClick={close} ref={closeRef}>
            <Icon name="times" />
          </button>
        </div>

        <p className="lx-drawer-note" role="status"><Icon name="check-circle" /> {message}</p>

        <ul className="lx-drawer-list">
          {items.map((it) => {
            const key = cartKey(it.name, it.amount, it.unit);
            const { quantity, ...rest } = it;
            return (
              <li key={key}>
                <img src={images[it.name] || "/cake-600.webp"} alt="" width={64} height={64} loading="lazy" />
                <div className="lx-drawer-info">
                  <strong>{it.name}</strong>
                  <span>{it.label} · {formatRupees(it.unitPrice)}</span>
                  <div className="lx-qty" role="group" aria-label={`Quantity of ${it.name}`}>
                    <button type="button" aria-label={`Decrease ${it.name}`} onClick={() => onSetItem(rest, quantity - 1)}><Icon name="minus" /></button>
                    <span aria-live="polite">{quantity}</span>
                    <button type="button" aria-label={`Increase ${it.name}`} onClick={() => onSetItem(rest, quantity + 1)}><Icon name="plus" /></button>
                  </div>
                </div>
                <span className="lx-drawer-line">{formatRupees(it.unitPrice * quantity)}</span>
              </li>
            );
          })}
        </ul>

        <div className="lx-drawer-foot">
          <div className="lx-drawer-total"><span>Subtotal</span><strong>{formatRupees(cartTotal(cart))}</strong></div>
          <Link href="/cart/" className="lx-btn lx-btn-primary">
            <Icon name="shopping-cart" /> View Cart &amp; Checkout
          </Link>
          <button type="button" className="lx-btn lx-btn-light" onClick={close}>Continue Shopping</button>
        </div>
      </aside>
    </div>
  );
}
