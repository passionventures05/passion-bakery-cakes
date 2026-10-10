"use client";

import { useId, useState } from "react";
import Icon from "@/components/Icon";
import { cartKey } from "@/lib/cart";
import { formatRupees } from "@/lib/format";
import { buildSizeOptions, getCategoryTag, normalizeCategory } from "@/lib/products";
import type { CartData, CartItem, Product } from "@/types";

interface Props {
  product: Product;
  cart: CartData;
  onSetItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  onOpenModal: (product: Product) => void;
  notify: (message: string, type?: "added" | "removed") => void;
}

export default function ProductCard({ product, cart, onSetItem, onOpenModal, notify }: Props) {
  const id = useId();
  const options = buildSizeOptions(product);
  const [idx, setIdx] = useState(0);
  const selected = options[idx] ?? options[0];
  const [imgSrc, setImgSrc] = useState(product.image || "/cake-600.webp");

  const item: Omit<CartItem, "quantity"> = {
    name: product.name,
    amount: selected.amount,
    unit: selected.unit,
    label: selected.label,
    unitPrice: selected.price,
  };
  const quantity = cart[cartKey(product.name, selected.amount, selected.unit)]?.quantity ?? 0;

  const add = () => {
    onSetItem(item, 1);
    notify(`${product.name} (${selected.label}) added to cart!`, "added");
  };

  const change = (delta: number) => {
    const next = Math.max(0, quantity + delta);
    onSetItem(item, next);
    if (next === 0) notify(`${product.name} (${selected.label}) removed from cart!`, "removed");
  };

  const open = () => onOpenModal(product);

  return (
    <div
      className="product-card"
      data-product-id={product.name.replace(/\s+/g, "-").toLowerCase()}
      data-tag={getCategoryTag(product.category)}
      data-category={normalizeCategory(product.category || "Cake")}
    >
      <div className="lx-card-media">
      <img
        src={imgSrc}
        alt={product.name}
        className="product-image"
        loading="lazy"
        decoding="async"
        role="button"
        tabIndex={0}
        aria-label={`View details for ${product.name}`}
        width={600}
        height={600}
        onError={() => setImgSrc("/cake-600.webp")}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        }}
      />
        <span className="lx-veg-badge"><Icon name="leaf" /> Pure Veg</span>
      </div>
      <h3>{product.name}</h3>
      <p className="lx-card-cat">{product.category}</p>
      <p className="lx-card-price">
        <span className="price">{formatRupees(selected.price)}</span> <small>/ {selected.label}</small>
      </p>

      <label htmlFor={`${id}-size`}>{selected.unit === "pc" ? "Choose quantity:" : "Choose weight:"}</label>
      <select
        id={`${id}-size`}
        className="weight-selector"
        value={idx}
        onChange={(e) => setIdx(Number(e.target.value))}
      >
        {options.map((o, i) => (
          <option key={o.amount} value={i}>{o.label}</option>
        ))}
      </select>

      <div className="quantity-control" style={{ display: quantity > 0 ? "flex" : "none" }}>
        <button className="minus" aria-label={`Decrease ${product.name} quantity`} onClick={() => change(-1)}>-</button>
        <span className="quantity" aria-live="polite">{quantity}</span>
        <button className="plus" aria-label={`Increase ${product.name} quantity`} onClick={() => change(1)}>+</button>
      </div>
      <button className="add-to-cart" style={{ display: quantity > 0 ? "none" : "block" }} onClick={add}>
        Add to Cart
      </button>
    </div>
  );
}
