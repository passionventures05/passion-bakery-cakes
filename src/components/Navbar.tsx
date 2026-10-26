"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/useCart";
import { site } from "@/lib/site";
import Icon from "./Icon";

export type NavActive = "home" | "products" | "special-order" | "hiring" | "cart";

interface NavbarProps {
  active?: NavActive;
  /** On the home page the section links scroll in place; on other pages they go to "/#section". */
  onHome?: boolean;
}

export default function Navbar({ active, onHome = false }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const { count, ready } = useCart();
  const section = (id: string) => (onHome ? `#${id}` : `/#${id}`);
  const cur = (name: NavActive) => (active === name ? ("page" as const) : undefined);
  const cls = (name: NavActive) => (active === name ? "active" : undefined);
  const close = () => setOpen(false);

  // little "bump" on the cart badge whenever something is added
  const prev = useRef<number | null>(null);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    if (!ready) return;
    if (prev.current !== null && count > prev.current) setBump((b) => b + 1);
    prev.current = count;
  }, [count, ready]);

  // Escape closes the mobile menu
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const links: { href: string; label: string; className?: string; current?: "page" }[] = [
    { href: "/", label: "Home", className: cls("home"), current: cur("home") },
    { href: onHome ? "#featured-products" : "/products/", label: "Products", className: cls("products"), current: cur("products") },
    { href: section("about-me"), label: "About" },
    { href: section("customer-reviews"), label: "Reviews" },
    { href: section("contact-me"), label: "Contact" },
    { href: "/special-order/", label: "Special Order", className: cls("special-order"), current: cur("special-order") },
    { href: "/hiring/", label: "Careers", className: cls("hiring"), current: cur("hiring") },
  ];

  return (
    <nav className={open ? "topnav lx-nav responsive" : "topnav lx-nav"} id="myTopnav" aria-label="Main">
      <div className="lx-nav-inner">
        <Link href="/" className="nav-brand" aria-label={`${site.name} — home`} onClick={close}>
          <img src="/Cake_Logo-96.webp" width={44} height={44} alt="" />
          <span className="nav-brand-name">{site.name}</span>
        </Link>

        <div className="nav-links" id="nav-links">
          {links.map((l, i) => (
            <Link
              key={l.label}
              href={l.href}
              className={l.className}
              aria-current={l.current}
              onClick={close}
              style={{ "--n": i } as React.CSSProperties}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="nav-actions">
          <Link
            href="/cart/"
            className="cart-icon"
            aria-current={cur("cart")}
            aria-label={`Shopping cart, ${count} ${count === 1 ? "item" : "items"}`}
            onClick={close}
          >
            <Icon name="shopping-cart" />
            <span key={bump} className={`cart-count${count === 0 ? " is-empty" : ""}${bump ? " bump" : ""}`} id="cart-count" aria-hidden="true">
              {count}
            </span>
          </Link>

          <button
            type="button"
            className="icon nav-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            aria-controls="nav-links"
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? "times" : "bars"} />
          </button>
        </div>
      </div>
    </nav>
  );
}
