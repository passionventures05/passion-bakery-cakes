import type { Metadata } from "next";
import ProductsView from "@/components/products/ProductsView";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cakes Collection",
  description: `Browse chocolate, red velvet, cheesecake, photo and custom cakes from ${site.name}, ${site.city}. Pure vegetarian and freshly baked.`,
  alternates: { canonical: "/products/" },
};

export default function ProductsPage() {
  return <ProductsView />;
}
