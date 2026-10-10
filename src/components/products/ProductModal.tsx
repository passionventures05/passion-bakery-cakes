"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { cartKey } from "@/lib/cart";
import { formatRupees } from "@/lib/format";
import {
  DEFAULT_DESCRIPTION,
  buildSizeOptions,
  calculateServing,
  normalizeCategory,
} from "@/lib/products";
import { site } from "@/lib/site";
import type { CartData, Product, SizeOption } from "@/types";

interface Props {
  product: Product;
  cart: CartData;
  onClose: () => void;
  onCommit: (quantity: number, option: SizeOption) => void;
}

const FOCUSABLE = 'button:not([disabled]), select, a[href], input, [tabindex]:not([tabindex="-1"])';

export default function ProductModal({ product, cart, onClose, onCommit }: Props) {
  const titleId = useId();
  const options = buildSizeOptions(product);
  const qtyInCart = (o: SizeOption) => cart[cartKey(product.name, o.amount, o.unit)]?.quantity ?? 0;

  const [idx, setIdx] = useState(0);
  const option = options[idx] ?? options[0];
  const [quantity, setQuantity] = useState(qtyInCart(option));
  const [show, setShow] = useState(false);
  const [imgSrc, setImgSrc] = useState(product.image || "/cake.webp");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<Element | null>(null);

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
    const id = window.setTimeout(() => closeBtnRef.current?.focus(), 30);
    return () => clearTimeout(id);
  }, [show]);

  const close = useCallback(() => {
    setShow(false);
    window.setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close();
      if (e.key !== "Tab" || !dialogRef.current) return;
      const els = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
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

  const chooseSize = (i: number) => {
    setIdx(i);
    setQuantity(qtyInCart(options[i]));
  };

  const addToCart = () => {
    const q = quantity === 0 ? 1 : quantity;
    setQuantity(q);
    onCommit(q, option);
    close();
  };

  return (
    <div
      className={show ? "modal-overlay show" : "modal-overlay"}
      id="productModal"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="modal-container" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef}>
        <button className="modal-close" aria-label="Close" onClick={close} ref={closeBtnRef}>
          <Icon name="times" />
        </button>

        <div className="modal-content">
          <div className="modal-left">
            <img src={imgSrc} alt={product.name} className="modal-image" onError={() => setImgSrc("/cake.webp")} />
          </div>

          <div className="modal-right">
            <h2 className="modal-product-name" id={titleId}>{product.name}</h2>
            <p className="modal-category">
              <Icon name="tag" /> {normalizeCategory(product.category || "Cake")}
            </p>

            <div className="modal-price">
              <span id="modalPrice">{formatRupees(option.price)}</span>
            </div>

            <div className="modal-description">
              <Icon name="info-circle" /> {product.description || DEFAULT_DESCRIPTION}
            </div>
            <p className="lx-modal-notes">
              <span><Icon name="leaf" /> Pure vegetarian</span>
              <span><Icon name="clock-o" /> Order {site.leadTimeHours} hrs ahead</span>
            </p>

            <div className="modal-section">
              <div className="modal-section-title">
                <Icon name="balance-scale" />
                {option.unit === "pc" ? "Select Quantity" : "Select Weight"}
              </div>
              <select
                className="modal-weight-selector"
                id="modalWeightSelector"
                aria-label={option.unit === "pc" ? "Select quantity" : "Select weight"}
                value={idx}
                onChange={(e) => chooseSize(Number(e.target.value))}
              >
                {options.map((w, i) => (
                  <option key={w.amount} value={i}>
                    {w.label} - {formatRupees(w.price)}
                  </option>
                ))}
              </select>
              <p className="modal-serving-info" id="modalServingInfo">
                <Icon name="users" /> Serves {calculateServing(option.amount, option.unit)}
              </p>
            </div>

            <div className="modal-section">
              <div className="modal-section-title">
                <Icon name="shopping-basket" />
                Quantity
              </div>
              <div className="modal-quantity-control">
                <button
                  id="modalMinusBtn"
                  aria-label="Decrease quantity"
                  disabled={quantity === 0}
                  onClick={() => quantity > 0 && setQuantity(quantity - 1)}
                >
                  <Icon name="minus" />
                </button>
                <span className="modal-quantity" id="modalQuantity" aria-live="polite">{quantity}</span>
                <button id="modalPlusBtn" aria-label="Increase quantity" onClick={() => setQuantity(quantity + 1)}>
                  <Icon name="plus" />
                </button>
              </div>
            </div>

            <button className="modal-add-to-cart" id="modalAddToCart" onClick={addToCart}>
              <Icon name="shopping-cart" />
              {qtyInCart(option) === 0 ? " Add to Cart" : " Update Cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
