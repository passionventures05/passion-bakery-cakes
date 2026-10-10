# PassionBakeryNChocos — Cakes (Next.js + React + TypeScript + Tailwind)

Cake-only website and Android app source. Static export, no server, $0 hosting.

## Commands
```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in ./out  (deploy to Cloudflare Pages)
npm run check      # type-check + unit tests
```

## Android APK (Capacitor)
```bash
npx cap add android   # first time only
npm run cap:sync      # builds ./out and syncs it into the Android project
npm run cap:open      # opens Android Studio -> Build > Build APK
```
The app opens WhatsApp directly (falls back to the browser), handles the hardware back button
(back / exit from home) and respects notch/safe areas. These native behaviours need a test on a real phone.

## Content management (Decap CMS)
Cakes live as one file each in `content/products/`, edited at `/admin/` (GitHub sign-in through a free Cloudflare Worker).
Saving commits to GitHub → GitHub Actions validates + builds → Cloudflare Pages deploys. See **docs/CMS-SETUP.md**
(one-time setup) and **docs/CLIENT-GUIDE.md** (for the client).
```bash
npm run dev:cms    # site + local CMS at http://localhost:3000/admin/index.html (no accounts needed)
```
`public/cake_products.json` is generated from `content/products` on every build — don't edit it.

## Where to change things
| What | File |
|---|---|
| Phone, email, address, hours, social links, lead time, advance %, **FSSAI number**, **UPI ID**, **cakes shown in "Signature Cakes"**, **delivery pincodes**, About photo | `src/lib/site.ts` |
| Home-page gallery photos (put the files in `public/gallery/`) | `src/lib/gallery.ts` |
| Home-page sections (hero, occasions, how to order, FAQ) | `src/components/home/` |
| Cakes (name, price, sizes, photo) | the CMS, or `content/products/*.json` |
| Reviews | `src/lib/reviews.ts` |
| Terms / Privacy wording | `src/app/terms/page.tsx`, `src/app/privacy/page.tsx` |
| Site URL for SEO (or set `NEXT_PUBLIC_SITE_URL`) | `src/lib/site.ts` |

Product sizes (in the CMS) are weights like `500gm,1kg,1.5kg,2kg` for cakes and `1pc,3pc,5pc,7pc` for per-piece items.
Prices scale from `basePrice`/`baseQuantity` and are rounded to whole rupees.

## Structure
```
public/            images + cake_products.json
src/app/           routes: / /products /cart /special-order /terms /privacy (+ robots, sitemap)
src/components/    Navbar, Footer, Icon, ContactForm, FloatingWhatsApp, ScrollReveal, home/, products/, cart/, special-order/
src/lib/           site config, cart (localStorage "cakeCart_v2"), pricing, validation, WhatsApp helper
src/styles/        shared.css (footer/base) + one file per page, plus luxe*.css (typography, nav, animations, new sections)
source-images/     original full-size images (not served; the site uses the compressed WebP copies in public/)
tests/             unit tests (vitest)
```

## Quality checks done
- Pixel-identical to the pre-refactor build after the CSS consolidation.
- 13 unit tests; 20 browser flow checks (cart, sizes, modal focus, WhatsApp links, mobile menu).
- axe-core: 0 violations on all pages (desktop + mobile). Text contrast measured against real pixels (WCAG AA).
- Lighthouse: Accessibility 100, SEO 100, Best Practices 100 (96 on Products while product photos are missing).

## Design layer (luxury refresh)
- Fonts are self-hosted in `public/fonts/` (Cormorant Garamond for headings, Inter for text, Great Vibes for script accents).
- Colours are unchanged. Scroll animations use `data-reveal` (see `ScrollReveal.tsx`) and respect *reduced motion*.
- Checkout order is: cart → details → pay the advance (UPI link / ID / QR) → send on WhatsApp. The cart is only cleared after the customer confirms they sent the message.
- Product descriptions in `content/products/*.json` were drafted from each cake's name — please review them and correct anything that doesn't match your recipes.

## Known / deferred
- Product photos: only one cake has a photo so far; add the rest in the CMS (compress them to WebP/JPG under ~200 KB first).
- Terms and Privacy are drafts based on how the site works today — review them.
