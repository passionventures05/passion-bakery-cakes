import { site } from "./site";

/**
 * Hiring page settings. Edit here to add a role, change a question or change where applications go.
 * Applications and questions are sent to `site.email` (no phone number is asked for or shown).
 */
export interface HireField {
  id: string;
  label: string;
  kind: "text" | "textarea" | "select";
  placeholder?: string;
  hint?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface HireRole {
  id: string;
  label: string;
  /** one line shown under the role picker */
  blurb: string;
  /** "business" roles also ask for a business name */
  business: boolean;
  fields: HireField[];
}

const yesNo = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

export const HIRE_ROLES: HireRole[] = [
  {
    id: "delivery",
    label: "Delivery partner",
    blurb: "Deliver fresh orders to our customers across the city.",
    business: false,
    fields: [
      {
        id: "vehicle", label: "Vehicle you will use", kind: "select", required: true,
        options: [
          { value: "Bike / scooter", label: "Bike / scooter" },
          { value: "Bicycle", label: "Bicycle" },
          { value: "Car", label: "Car" },
          { value: "Van / tempo", label: "Van / tempo" },
          { value: "I don't have a vehicle yet", label: "I don't have a vehicle yet" },
        ],
      },
      { id: "licence", label: "Valid driving licence", kind: "select", required: true, options: [...yesNo, { value: "Applying", label: "Applying" }] },
      { id: "areas", label: "Areas you can deliver in", kind: "text", required: true, placeholder: "e.g. Andheri, Bandra, Powai" },
      {
        id: "availability", label: "Availability", kind: "select", required: true,
        options: [
          { value: "Full time", label: "Full time" },
          { value: "Part time", label: "Part time" },
          { value: "Weekends & festivals only", label: "Weekends & festivals only" },
        ],
      },
      { id: "experience", label: "Delivery experience", kind: "text", placeholder: "e.g. 2 years with a food delivery app (or type 'None')" },
    ],
  },
  {
    id: "cake-supply",
    label: "Cake & bakery supplier",
    blurb: "Supply cakes, cupcakes, cream, ingredients, packaging or other bakery items.",
    business: true,
    fields: [
      { id: "supplies", label: "What can you supply?", kind: "textarea", required: true, placeholder: "e.g. Eggless cakes, whipping cream, fondant, cake boxes" },
      { id: "eggless", label: "Are all your products pure vegetarian / eggless?", kind: "select", required: true, options: yesNo, hint: "We only sell pure vegetarian treats." },
      { id: "capacity", label: "Capacity per week", kind: "text", required: true, placeholder: "e.g. 100 cakes or 50 kg" },
      { id: "leadtime", label: "Usual lead time for an order", kind: "text", placeholder: "e.g. 2 days" },
      { id: "fssai", label: "FSSAI licence number", kind: "text", placeholder: "Type 'Applied' or 'None' if you don't have one yet" },
      { id: "link", label: "Website, Instagram or catalogue link", kind: "text", placeholder: "Link to your work or price list" },
    ],
  },
  {
    id: "party-supply",
    label: "Party material supplier",
    blurb: "Supply balloons, decor, candles, toppers, tableware and party props.",
    business: true,
    fields: [
      { id: "supplies", label: "What can you supply?", kind: "textarea", required: true, placeholder: "e.g. Balloons, banners, candles, toppers, disposable tableware" },
      { id: "minorder", label: "Minimum order size", kind: "text", placeholder: "e.g. ₹5,000 or 100 pieces" },
      { id: "leadtime", label: "Usual lead time for an order", kind: "text", placeholder: "e.g. 3 days" },
      { id: "gst", label: "GST number", kind: "text", placeholder: "Type 'None' if you don't have one" },
      { id: "link", label: "Website, Instagram or catalogue link", kind: "text", placeholder: "Link to your products or price list" },
    ],
  },
  {
    id: "kitchen",
    label: "Kitchen & baking team",
    blurb: "Join our kitchen as a baker, cake decorator or helper.",
    business: false,
    fields: [
      {
        id: "skill", label: "What you do best", kind: "select", required: true,
        options: [
          { value: "Baking", label: "Baking" },
          { value: "Fondant & sugar art", label: "Fondant & sugar art" },
          { value: "Cake decorating", label: "Cake decorating" },
          { value: "Packing & kitchen help", label: "Packing & kitchen help" },
        ],
      },
      { id: "experience", label: "Experience", kind: "text", required: true, placeholder: "e.g. 3 years in a home bakery (or type 'Fresher')" },
      {
        id: "availability", label: "Availability", kind: "select", required: true,
        options: [
          { value: "Full time", label: "Full time" },
          { value: "Part time", label: "Part time" },
          { value: "Festival season only", label: "Festival season only" },
        ],
      },
      { id: "link", label: "Link to your work", kind: "text", placeholder: "Instagram or Google Drive link with photos (optional)" },
    ],
  },
  {
    id: "other",
    label: "Something else",
    blurb: "Photography, social media, packaging, events — tell us how you can help.",
    business: false,
    fields: [
      { id: "offer", label: "How would you like to work with us?", kind: "textarea", required: true, placeholder: "Describe the role or service you have in mind" },
      { id: "link", label: "Link to your work", kind: "text", placeholder: "Portfolio, Instagram or website (optional)" },
    ],
  },
];

export const findRole = (id: string) => HIRE_ROLES.find((r) => r.id === id);

/** Keeps the email link short enough for mail apps. */
export const MAX_FIELD_LENGTH = 500;

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export interface Application {
  role: HireRole;
  details: Record<string, string>;
  name: string;
  business: string;
  email: string;
  city: string;
  message: string;
}

export const buildApplicationText = (a: Application) => {
  const lines = [
    `Role: ${a.role.label}`,
    `Name: ${a.name.trim()}`,
    ...(a.role.business ? [`Business name: ${a.business.trim() || "-"}`] : []),
    `Email: ${a.email.trim()}`,
    `City / area: ${a.city.trim()}`,
    "",
    ...a.role.fields.map((f) => `${f.label}: ${a.details[f.id]?.trim() || "-"}`),
    "",
    "About me:",
    a.message.trim() || "-",
  ];
  return lines.join("\n");
};

export const applicationSubject = (a: Application) => `Application: ${a.role.label} - ${a.name.trim()}`;

/** mailto: link to the business email. */
export const mailtoUrl = (subject: string, body: string) =>
  `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
