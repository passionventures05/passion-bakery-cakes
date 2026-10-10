import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { site, whatsappChatUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Delivery & Terms",
  description: `How ordering, payment, delivery and cancellations work at ${site.name}.`,
  alternates: { canonical: "/terms/" },
};

// NOTE FOR OWNER: review the wording of every section below and adjust it to your real policies.
export default function TermsPage() {
  return (
    <LegalPage title="Delivery & Terms" updated="September 2026">
      <h2>How ordering works</h2>
      <ol>
        <li>Choose your cakes on the <Link href="/products/">Products</Link> page, or request a custom design through <Link href="/special-order/">Special Order</Link>.</li>
        <li>Fill in the order form. Your order is sent to us on WhatsApp.</li>
        <li>We confirm availability and the final price with you on WhatsApp.</li>
        <li>Pay {site.advancePercent}% of the total in advance (UPI ID or QR code shown at checkout) and send us the payment screenshot. Your order is confirmed once the advance is received.</li>
        <li>We bake your cake fresh, then deliver it or keep it ready for pick-up.</li>
      </ol>

      <h2>Notice period</h2>
      <p>
        Every cake is made to order, so we need at least <strong>{site.leadTimeHours} hours</strong> notice
        for delivery or pick-up. Special (custom-design) cakes start at 2.5 kg, and their final price is
        confirmed after we review your requirements.
      </p>

      <h2>Delivery and pick-up</h2>
      <ul>
        <li>We serve {site.city} and nearby areas. Ask us on WhatsApp if you are unsure whether we deliver to you.</li>
        <li>Choose <em>Home Delivery</em> or <em>Pick Up</em> on the order form. Any delivery charge is confirmed before you pay.</li>
        <li>Please share a complete address and a reachable phone number. If you are ordering for someone else, add their details in the form.</li>
        <li>Cakes are delicate. Please receive them promptly and keep them refrigerated as advised.</li>
      </ul>

      <h2>Changes, cancellations and refunds</h2>
      <p>
        Because each cake is prepared specially for you, please contact us on WhatsApp as early as possible
        if you need to change or cancel an order. Requests are handled case by case, and we will always tell
        you what is possible before any payment is kept or returned. If something is wrong with your order
        when it arrives, message us the same day with a photo and we will make it right.
      </p>

      <h2>Allergens and food safety</h2>
      <p>
        All our products are pure vegetarian and made in a hygienic kitchen. Our cakes may contain milk,
        wheat (gluten), nuts and other allergens. Please tell us about any allergy when you order.
      </p>
      {site.fssai && <p>FSSAI Licence No. {site.fssai}</p>}

      <h2>Prices and availability</h2>
      <p>
        Prices are in Indian rupees and shown for the size you pick. Designs, flavours and availability
        can vary with the season and your requirements; we confirm everything before you pay.
      </p>

      <h2>Contact</h2>
      <p>
        WhatsApp / call: <a href={whatsappChatUrl}>{site.phoneDisplay}</a><br />
        Email: <a href={`mailto:${site.email}`}>{site.email}</a><br />
        Hours: {site.hours}
      </p>
    </LegalPage>
  );
}
