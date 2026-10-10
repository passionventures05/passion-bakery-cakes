"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { formatRupees } from "@/lib/format";
import { buildSizeOptions, getCachedProducts, setCachedProducts } from "@/lib/products";
import { site } from "@/lib/site";
import type { Product } from "@/types";

/** "Signature Cakes" — a handful of favourites with a starting price. Names come from site.featured. */
export default function FeaturedCakes() {
  const [items, setItems] = useState<Product[] | null>(null);

  useEffect(() => {
    let alive = true;
    const pick = (all: Product[]) => {
      const byName = new Map(all.map((p) => [p.name, p]));
      let chosen = site.featured.map((n) => byName.get(n)).filter((p): p is Product => !!p);
      if (chosen.length < 3) chosen = all.filter((p) => p.name).slice(0, 6);
      return chosen.slice(0, 6);
    };
    const cached = getCachedProducts();
    if (cached && cached.length) {
      setItems(pick(cached));
      return;
    }
    fetch("/cake_products.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Product[]) => {
        setCachedProducts(data);
        if (alive) setItems(pick(data));
      })
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, []);

  if (items && items.length === 0) return null;

  return (
    <div className="lx-featured-grid">
      {items === null
        ? Array.from({ length: 6 }, (_, i) => (
            <div className="lx-skel-card" key={i} aria-hidden="true">
              <div className="lx-skel lx-skel-img" />
              <div className="lx-skel lx-skel-line" />
              <div className="lx-skel lx-skel-line short" />
            </div>
          ))
        : items.map((p, i) => {
            const first = buildSizeOptions(p)[0];
            return (
              <Link
                key={p.name}
                href="/products/"
                className="lx-feature"
                data-reveal=""
                style={{ "--i": i } as React.CSSProperties}
                aria-label={`${p.name}, from ${formatRupees(first.price)}`}
              >
                <span className="lx-feature-media">
                  <img
                    src={p.image || "/cake-600.webp"}
                    alt={p.name}
                    width={600}
                    height={462}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.src.endsWith("/cake-600.webp")) img.src = "/cake-600.webp";
                    }}
                  />
                  <span className="lx-veg-badge"><Icon name="leaf" /> Pure Veg</span>
                </span>
                <span className="lx-feature-body">
                  <span className="lx-feature-name">{p.name}</span>
                  <span className="lx-feature-price">
                    From <strong>{formatRupees(first.price)}</strong> <small>/ {first.label}</small>
                  </span>
                  <span className="lx-feature-more">View cake <Icon name="arrow-right" /></span>
                </span>
              </Link>
            );
          })}
    </div>
  );
}
