/** Single source of truth for business details. Edit here; everything else reads from this file. */
export const site = {
  name: "PasssionBakeryNChocos",
  tagline: "Custom cakes, handcrafted with love in Mumbai",
  description:
    "Order custom birthday, wedding and occasion cakes from PasssionBakeryNChocos, Mumbai. Pure vegetarian, freshly baked in a hygienic home kitchen.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://passionbakerynchocos.com",

  phone: "7365887555",
  phoneDisplay: "+91 73658 87555",
  whatsappNumber: "917365887555", // country code + number, digits only
  email: "manjupathak135@gmail.com",
  hours: "9AM - 6PM Daily",
  address: "Mumbai, Maharashtra, India",
  city: "Mumbai",
  region: "Maharashtra",
  country: "IN",

  /** FSSAI licence number. Leave empty to hide it from the footer. */
  fssai: "",

  /** UPI details shown after an order is sent (advance payment). */
  upiId: "manjupathak135@okicici",
  instagramHandle: "@passionbakerynchoco15",

  /** Photo shown in the "About" section (swap for a photo of the baker any time). */
  aboutImage: "/Cake_Logo-480.webp",

  /** Cakes shown in "Signature Cakes" on the home page (must match the cake names exactly). */
  featured: [
    "Strawberry Cheese Cake",
    "Black Forest Cake",
    "Rich Red Velvet Cream Cake",
    "Chocolate Biscoff Cake",
    "Rasgulla Cake",
    "Ferrero Rocher Chocolate Cake",
  ] as readonly string[],

  /**
   * Pincodes you deliver to (e.g. ["400001", "400050"]). While this list is empty the
   * delivery checker simply asks the customer to confirm their area with you on WhatsApp.
   */
  deliveryPincodes: [] as readonly string[],

  /** Minimum notice for delivery / pick-up, in hours. */
  leadTimeHours: 36,
  /** Share of the total to be paid in advance to confirm an order. */
  advancePercent: 50,

  social: {
    facebook: "https://www.facebook.com/share/17UMkLQ8Kb/",
    instagram: "https://www.instagram.com/passionbakerynchoco15?igsh=NTA4NmNsZDNjd2Rp",
    pinterest: "https://pin.it/5SXLo07ns",
    youtube: "https://www.youtube.com/@passsionbakerynchocos",
    googleMaps: "https://share.google/scxv6y8LarOZqxfFF",
    googleReviews: "https://maps.app.goo.gl/G5Ro7eh8443WCXCo8",
  },
} as const;

export const whatsappChatUrl = `https://wa.me/${site.whatsappNumber}`;
