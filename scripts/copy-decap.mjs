// Copies the Decap CMS bundle from node_modules into public/admin so /admin works without any CDN.
import fs from "node:fs";
import path from "node:path";

const src = path.resolve("node_modules/decap-cms/dist");
const dest = path.resolve("public/admin");
if (!fs.existsSync(src)) {
  console.error("✖ decap-cms is not installed. Run `npm install` first.");
  process.exit(1);
}
fs.mkdirSync(dest, { recursive: true });
let n = 0;
for (const f of fs.readdirSync(src)) {
  if (/^(\d+\.)?decap-cms\.js$/.test(f)) {
    fs.copyFileSync(path.join(src, f), path.join(dest, f));
    n++;
  }
}
console.log(`✓ CMS files ready (${n} files) -> public/admin`);
