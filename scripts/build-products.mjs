// Turns content/products/*.json (edited in the CMS) into public/cake_products.json (read by the website).
// Fails with a plain-language message if anything is wrong, so a bad edit never reaches the live site.
import fs from "node:fs";
import { buildCatalogue } from "./products-lib.mjs";

const { catalogue, errors, warnings, fileCount } = buildCatalogue("content/products", "public");

for (const w of warnings) console.warn(`⚠  ${w}`);
if (errors.length) {
  console.error("\n✖ Product content has problems:\n");
  for (const e of errors) console.error("  - " + e);
  console.error("\nFix these in the CMS (or the file) and save again.\n");
  process.exit(1);
}
if (catalogue.length === 0) {
  console.error("✖ No products found in content/products");
  process.exit(1);
}
fs.writeFileSync("public/cake_products.json", JSON.stringify(catalogue, null, 2) + "\n");
console.log(`✓ ${catalogue.length} products published (${fileCount - catalogue.length} hidden) -> public/cake_products.json`);
