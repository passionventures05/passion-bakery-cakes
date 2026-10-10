// Product catalogue rules: validation + conversion of CMS files into public/cake_products.json.
// Plain ESM (no dependencies) so it runs before the Next.js build and inside tests.
import fs from "node:fs";
import path from "node:path";

/** Must match the filter list in src/lib/products.ts and the category list in public/admin/config.yml */
export const CATEGORIES = [
  "Chocolate", "Vanilla", "Custom Cake", "Rich Chocolate Truffle", "Occasion Cake", "Flavoured Cakes",
  "Traditional Fusion Cakes", "Red Velvet Cake", "Dry Cakes", "Theme Cakes (Fondant or Chocolate)",
  "Fondant & Semi Fondant Cake", "Multi-Tier Cake", "Low Sugar Cake", "Diabetic Cake", "Cheese Cake", "Photo Cake",
];

export const DEFAULT_DESCRIPTION = "Delicious handcrafted cake made with love.";
const MAX_IMAGE_BYTES = 1_500_000;

/** "500gm" | "1.5kg" | "3pc" -> { amount, unit } (grams or pieces); null if not understood */
export const parseSize = (raw) => {
  const m = String(raw ?? "").toLowerCase().replace(/\s+/g, "").match(/^(\d+(?:\.\d+)?)(kg|gm|g|pcs|pc|pieces|piece)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const u = m[2];
  if (u === "kg") return { amount: Math.round(n * 1000), unit: "g" };
  if (u === "gm" || u === "g") return { amount: n, unit: "g" };
  if (u) return { amount: n, unit: "pc" };
  return n < 50 ? { amount: n, unit: "pc" } : { amount: n, unit: "g" };
};

const toList = (v) => (Array.isArray(v) ? v : String(v ?? "").split(",")).map((s) => String(s).trim()).filter(Boolean);

/**
 * Validates one CMS product file. Returns { product, errors, warnings }.
 * `publicDir` is used to check that the chosen photo really exists.
 */
export function validateProduct(raw, { file = "product", publicDir = "public" } = {}) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(`${file}: ${m}`);

  const name = String(raw?.name ?? "").trim();
  if (!name) err("the cake needs a name");

  const category = CATEGORIES.find((c) => c.toLowerCase() === String(raw?.category ?? "").trim().toLowerCase());
  if (!category) err(`category "${raw?.category ?? ""}" is not one of the allowed categories`);

  const basePrice = Number(raw?.basePrice);
  if (!Number.isFinite(basePrice) || basePrice <= 0) err("the starting price must be a number above 0");

  const base = parseSize(raw?.baseQuantity);
  if (!base) err(`base size "${raw?.baseQuantity ?? ""}" is not understood (use e.g. 500gm, 1kg or 1pc)`);

  let sizes = toList(raw?.availableQuantities).map((s) => ({ text: s, parsed: parseSize(s) }));
  if (sizes.length === 0) err("choose at least one size customers can order");
  for (const s of sizes) {
    if (!s.parsed) err(`size "${s.text}" is not understood`);
    else if (base && s.parsed.unit !== base.unit)
      err(`size "${s.text}" is ${s.parsed.unit === "pc" ? "pieces" : "weight"} but the base size "${raw.baseQuantity}" is ${base.unit === "pc" ? "pieces" : "weight"}; use one kind per cake`);
  }
  sizes = sizes.filter((s) => s.parsed).sort((a, b) => a.parsed.amount - b.parsed.amount);

  let image;
  if (raw?.image) {
    const rel = String(raw.image);
    if (!rel.startsWith("/")) err(`photo path "${rel}" must start with "/"`);
    else {
      const full = path.join(publicDir, rel);
      if (!fs.existsSync(full)) warnings.push(`${file}: photo ${rel} was not found, the default photo will be shown`);
      else {
        image = rel;
        if (fs.statSync(full).size > MAX_IMAGE_BYTES)
          warnings.push(`${file}: photo ${rel} is over 1.5 MB, please upload a smaller one (it slows the site down)`);
      }
    }
  }

  let order;
  if (raw?.order !== undefined && raw?.order !== null && raw?.order !== "") {
    order = Number(raw.order);
    if (!Number.isFinite(order)) err("the list position must be a number");
  }

  const product = {
    name,
    baseQuantity: String(raw?.baseQuantity ?? "").trim(),
    basePrice: Number.isFinite(basePrice) ? basePrice : 0,
    category: category ?? "",
    availableQuantities: sizes.map((s) => s.text).join(","),
    description: String(raw?.description ?? "").trim() || DEFAULT_DESCRIPTION,
    ...(image ? { image } : {}),
  };
  return { product, available: raw?.available !== false, order, errors, warnings };
}

/** Reads every content/products/*.json, validates, sorts. Returns { catalogue, errors, warnings }. */
export function buildCatalogue(contentDir = "content/products", publicDir = "public") {
  const errors = [];
  const warnings = [];
  const items = [];
  const files = fs.existsSync(contentDir) ? fs.readdirSync(contentDir).filter((f) => f.endsWith(".json")).sort() : [];

  for (const f of files) {
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(contentDir, f), "utf8"));
    } catch (e) {
      errors.push(`${f}: not valid JSON (${e.message})`);
      continue;
    }
    const r = validateProduct(raw, { file: f, publicDir });
    errors.push(...r.errors);
    warnings.push(...r.warnings);
    if (r.errors.length === 0 && r.available) items.push(r);
  }

  const seen = new Map();
  for (const it of items) {
    const key = it.product.name.toLowerCase();
    if (seen.has(key)) errors.push(`two cakes are both called "${it.product.name}"; names must be different`);
    seen.set(key, true);
  }

  items.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.product.name.localeCompare(b.product.name));
  return { catalogue: items.map((i) => i.product), errors, warnings, fileCount: files.length };
}
