import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} collects and uses your information.`,
  alternates: { canonical: "/privacy/" },
};

// NOTE FOR OWNER: update this page if you add accounts, analytics or online payments later.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="September 2026">
      <p>
        {site.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) respects your privacy. This page explains what
        information this website and app use, and why.
      </p>

      <h2>Information you give us</h2>
      <p>
        When you place an order, send a special-order request or use the contact form, you type details
        such as your name, phone number, email, delivery address, delivery date and cake preferences.
        This information is sent to us as a WhatsApp message that you review and send yourself.
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>To confirm, prepare and deliver your order.</li>
        <li>To contact you about your order or reply to your enquiry.</li>
      </ul>
      <p>We do not sell your information and do not use it for advertising.</p>

      <h2>Your cart on this device</h2>
      <p>
        Items you add to your cart are stored only in your own browser or app (local storage) so they are
        still there when you come back. This data never leaves your device until you send an order.
      </p>

      <h2>Third parties</h2>
      <ul>
        <li><strong>WhatsApp (Meta)</strong> carries your order message to us and is governed by its own privacy policy.</li>
        <li><strong>Payments</strong> are made directly by you through your UPI app; we do not receive or store your bank or card details.</li>
        <li>Links to Facebook, Instagram, Pinterest, YouTube and Google open those services, which have their own policies.</li>
      </ul>

      <h2>Keeping and deleting your information</h2>
      <p>
        We keep order conversations only as long as needed to serve you and meet our record-keeping needs.
        To ask us to delete your information, message or email us using the details below.
      </p>

      <h2>Children</h2>
      <p>This website is meant for adults placing orders. We do not knowingly collect information from children.</p>

      <h2>Contact</h2>
      <p>
        Questions about this policy: <a href={`mailto:${site.email}`}>{site.email}</a> or {site.phoneDisplay}.
      </p>
    </LegalPage>
  );
}
