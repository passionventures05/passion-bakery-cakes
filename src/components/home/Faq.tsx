import Link from "next/link";
import { site } from "@/lib/site";
import Icon from "@/components/Icon";

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: "How do I place an order?",
    a: (
      <>
        Add cakes to your cart on the <Link href="/products/">Products</Link> page, or request a custom
        design through <Link href="/special-order/">Special Order</Link>. Your order is sent to us on WhatsApp,
        we confirm availability and the final price, and your order is confirmed once the advance is received.
      </>
    ),
  },
  {
    q: "How much notice do you need?",
    a: <>Every cake is made to order, so we need at least {site.leadTimeHours} hours&apos; notice for delivery or pick-up.</>,
  },
  {
    q: "How does the advance payment work?",
    a: (
      <>
        We ask for {site.advancePercent}% of the total in advance, by UPI ID or QR code. After you send your
        order you&apos;ll see the exact amount. Send us the payment screenshot on WhatsApp and we&apos;ll confirm.
      </>
    ),
  },
  {
    q: "Can you make a custom-designed cake?",
    a: (
      <>
        Yes! Custom cakes start at 2.5 kg and the final price is confirmed after we review your requirements.
        Fill in the <Link href="/special-order/">Special Order</Link> form and send any reference pictures on
        WhatsApp.
      </>
    ),
  },
  {
    q: "Are your cakes vegetarian? What about allergies?",
    a: <>All our products are pure vegetarian and made in a hygienic kitchen. Our cakes may contain milk, wheat (gluten), nuts and other allergens, so please tell us about any allergy when you order.</>,
  },
  {
    q: "Do you deliver to my area?",
    a: (
      <>
        We serve {site.city} and nearby areas. Check your pincode on the <Link href="/products/">Products</Link>{" "}
        page or ask us on WhatsApp. You can also choose pick-up. Any delivery charge is confirmed before you pay.
      </>
    ),
  },
  {
    q: "What if I need to change or cancel an order?",
    a: <>Please message us on WhatsApp as early as possible. Each cake is made specially for you, so requests are handled case by case, and we&apos;ll always tell you what is possible.</>,
  },
];

export default function Faq() {
  return (
    <div className="lx-faq">
      {faqs.map((f, i) => (
        <details key={f.q} className="lx-faq-item" data-reveal="" style={{ "--i": i } as React.CSSProperties}>
          <summary>
            <span>{f.q}</span>
            <Icon name="chevron-down" />
          </summary>
          <div className="lx-faq-body">{f.a}</div>
        </details>
      ))}
    </div>
  );
}
