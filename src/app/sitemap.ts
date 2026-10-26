import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/products/", "/special-order/", "/hiring/", "/terms/", "/privacy/"];
  return paths.map((p) => ({ url: `${site.url}${p}`, changeFrequency: p === "/" || p === "/products/" ? "weekly" : "monthly" }));
}
