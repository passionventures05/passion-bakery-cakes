import type { Product, SizeOption, Unit } from "@/types";
import { formatAmount } from "./format";

export const PRODUCTS_PER_PAGE = 24;
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
export const DEFAULT_DESCRIPTION = "Delicious handcrafted cake made with love.";
const DEFAULT_QUANTITIES = "500gm,1kg,1.5kg,2kg";

export const TAG_MAPPING: Record<string, string> = {
  chocolate: "tag1",
  vanilla: "tag2",
  "custom cake": "tag3",
  "rich chocolate truffle": "tag4",
  "occasion cake": "tag5",
  "flavoured cakes": "tag6",
  "traditional fusion cakes": "tag7",
  "red velvet cake": "tag8",
  "dry cakes": "tag9",
  "theme cakes (fondant or chocolate)": "tag10",
  "fondant & semi fondant cake": "tag11",
  "multi-tier cake": "tag12",
  "low sugar cake": "tag13",
  "diabetic cake": "tag14",
  "cheese cake": "tag15",
  "photo cake": "tag16",
};

export const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "tag1", label: "Chocolate" },
  { value: "tag2", label: "Vanilla" },
  { value: "tag3", label: "Custom Cake" },
  { value: "tag4", label: "Rich Chocolate Truffle" },
  { value: "tag5", label: "Occasion Cake" },
  { value: "tag6", label: "Flavoured Cakes" },
  { value: "tag7", label: "Traditional Fusion Cakes" },
  { value: "tag8", label: "Red Velvet Cake" },
  { value: "tag9", label: "Dry Cakes" },
  { value: "tag10", label: "Theme Cakes (Fondant or Chocolate)" },
  { value: "tag11", label: "Fondant & Semi Fondant Cake" },
  { value: "tag12", label: "Multi-Tier Cake" },
  { value: "tag13", label: "Low Sugar Cake" },
  { value: "tag14", label: "Diabetic Cake" },
  { value: "tag15", label: "Cheese Cake" },
  { value: "tag16", label: "Photo Cake" },
];

export const normalizeCategory = (category: unknown) => String(category).toLowerCase().trim();
export const getCategoryTag = (category: unknown) => TAG_MAPPING[normalizeCategory(category)] || "";

/**
 * Understands "500gm", "500g", "1kg", "1.5 kg", "3pc", "3 pieces". A bare number is
 * pieces when small (< 50) and grams otherwise. Returns null for garbage.
 */
export const parseQuantity = (raw: unknown): { amount: number; unit: Unit } | null => {
  const m = String(raw ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .match(/^(\d+(?:\.\d+)?)(kg|gm|g|pcs|pc|pieces|piece)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const u = m[2];
  if (u === "kg") return { amount: Math.round(n * 1000), unit: "g" };
  if (u === "gm" || u === "g") return { amount: n, unit: "g" };
  if (u) return { amount: n, unit: "pc" };
  return n < 50 ? { amount: n, unit: "pc" } : { amount: n, unit: "g" };
};

/** price for `amount` when `baseAmount` costs `basePrice`, rounded to whole rupees */
export const calculatePrice = (basePrice: number, baseAmount: number, amount: number) =>
  Math.round(basePrice * (amount / baseAmount));

export const buildSizeOptions = (product: Product): SizeOption[] => {
  const basePrice = parseFloat(String(product.basePrice)) || 0;
  const base = parseQuantity(product.baseQuantity) ?? { amount: 500, unit: "g" as Unit };
  const list = (product.availableQuantities || DEFAULT_QUANTITIES)
    .split(",")
    .map(parseQuantity)
    .filter((q): q is { amount: number; unit: Unit } => q !== null && q.unit === base.unit);
  const unique = [...new Map(list.map((q) => [q.amount, q])).values()].sort((a, b) => a.amount - b.amount);
  const options = unique.length ? unique : [base];
  return options.map((q) => ({
    amount: q.amount,
    unit: q.unit,
    label: formatAmount(q.amount, q.unit),
    price: calculatePrice(basePrice, base.amount, q.amount),
  }));
};

/** Serving estimate: 125 g per person for cakes, one person per piece. */
export const calculateServing = (amount: number, unit: Unit) => {
  if (unit === "pc") return `${amount} ${amount === 1 ? "person" : "people"}`;
  const people = Math.floor(amount / 125);
  return `${Math.max(1, people - 1)}-${people + 1} people`;
};

// ---- 5 minute sessionStorage cache ----
const CACHE_KEY = "productsCache";

export const getCachedProducts = (): Product[] | null => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

export const setCachedProducts = (data: Product[]) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    console.warn("Cache storage failed:", e);
  }
};
