import type { CartData } from "@/types";
import { cartItems, cartTotal } from "@/lib/cart";
import { formatRupees } from "@/lib/format";
import { site } from "@/lib/site";
import { earliestDelivery, validatePhoneNumber } from "@/lib/validation";

export interface OrderForm {
  name: string;
  address: string;
  phone: string;
  orderingForSomeone: "" | "yes" | "no";
  deliveryPhone: string;
  deliveryName: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  cakeName: string;
  occasion: string;
  deliveryMode: "" | "home-delivery" | "pick-up";
  specialRequest: string;
}

export const emptyOrderForm: OrderForm = {
  name: "",
  address: "",
  phone: "",
  orderingForSomeone: "",
  deliveryPhone: "",
  deliveryName: "",
  deliveryAddress: "",
  deliveryDate: "",
  deliveryTime: "",
  cakeName: "",
  occasion: "",
  deliveryMode: "",
  specialRequest: "",
};

export interface Delivery {
  phone: string;
  name: string;
  address: string;
}

export const getCartDetails = (cart: CartData) => {
  const items = cartItems(cart).map((i) => {
    const line = i.unitPrice * i.quantity;
    return `${i.name} (${i.label}) x ${i.quantity} = ${formatRupees(line)}`;
  });
  const total = cartTotal(cart);
  return { total, items };
};

/** Returns an error message, or null when the order is valid. */
export const validateOrder = (f: OrderForm, delivery: Delivery, now: Date = new Date()): string | null => {
  if (!f.name.trim() || !f.address.trim() || !f.phone.trim())
    return "Please fill in all required customer fields (Name, Address, Phone).";
  if (!validatePhoneNumber(f.phone.trim()))
    return "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9 for Customer Phone.";
  if (f.orderingForSomeone === "yes") {
    if (!delivery.phone || !delivery.name || !delivery.address)
      return "Please fill in all delivery details (Phone, Name, Address).";
    if (!validatePhoneNumber(delivery.phone))
      return "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9 for Delivery Phone.";
  }
  if (!f.deliveryDate || !f.deliveryTime) return "Please select delivery date and time.";
  if (new Date(`${f.deliveryDate}T${f.deliveryTime}`) < earliestDelivery(now))
    return `The selected delivery time must be at least ${site.leadTimeHours} hours from now. Please select a later date and time.`;
  if (!f.deliveryMode) return "Please select a delivery mode.";
  if (!f.cakeName.trim() || !f.occasion.trim()) return "Please fill in cake name and occasion.";
  return null;
};

export const generateWhatsAppMessage = (
  f: OrderForm,
  delivery: Delivery,
  details: { total: number; items: string[] }
) => {
  const mode = f.deliveryMode === "home-delivery" ? "🏠 Home Delivery" : "🏪 Pick Up";
  const special = f.specialRequest.trim();

  let message =
    `🎂 *${site.name.toUpperCase()}* 🎂\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📋 *NEW ORDER RECEIVED*\n\n` +
    `👤 *CUSTOMER INFORMATION*\n` +
    `├─ Name: ${f.name.trim()}\n` +
    `├─ Address: ${f.address.trim()}\n` +
    `└─ Phone: +91 ${f.phone.trim()}\n\n`;

  if (f.orderingForSomeone === "yes") {
    message +=
      `👥 *ORDERING FOR SOMEONE ELSE*\n` +
      `🚚 *DELIVERY DETAILS*\n` +
      `├─ Recipient Name: ${delivery.name}\n` +
      `├─ Delivery Address: ${delivery.address}\n` +
      `├─ Contact Number: +91 ${delivery.phone}\n` +
      `├─ Delivery Date: 📅 ${f.deliveryDate}\n` +
      `├─ Delivery Time: 🕐 ${f.deliveryTime}\n` +
      `└─ Delivery Mode: ${mode}\n\n`;
  } else {
    message +=
      `🚚 *DELIVERY DETAILS*\n` +
      `├─ Delivery Date: 📅 ${f.deliveryDate}\n` +
      `├─ Delivery Time: 🕐 ${f.deliveryTime}\n` +
      `└─ Delivery Mode: ${mode}\n\n`;
  }

  message +=
    `🛍️ *ORDER SUMMARY*\n` +
    `${details.items.map((item) => `├─ ${item}`).join("\n")}\n` +
    `└─ *Total Amount: ${formatRupees(details.total)}*\n\n` +
    `🎉 *CAKE CUSTOMIZATION*\n` +
    `├─ Name on Cake: ${f.cakeName.trim()}\n` +
    `└─ Occasion: ${f.occasion.trim()}\n\n`;

  if (special) message += `💬 *SPECIAL REQUESTS*\n${special}\n\n`;

  message +=
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 *PAYMENT REMINDER*\n` +
    `Please pay ${site.advancePercent}% advance (${formatRupees((details.total * site.advancePercent) / 100)}) to confirm your order.\n\n` +
    `✅ Thank you for choosing ${site.name}!\n` +
    `We look forward to making your celebration special! 🎊`;

  return message;
};

/** The recipient of the cake (the customer, or someone else when ordering as a gift). */
export const buildDelivery = (f: OrderForm): Delivery => {
  const someone = f.orderingForSomeone === "yes";
  return {
    phone: someone ? f.deliveryPhone.trim() : f.phone.trim(),
    name: someone ? f.deliveryName.trim() : f.name.trim(),
    address: someone ? f.deliveryAddress.trim() : f.address.trim(),
  };
};

/** Field ids in the order they appear on the form (used to focus the first problem). */
export const ORDER_FIELD_ORDER = [
  "name", "address", "phone", "ordering-for-someone", "delivery-phone", "delivery-name", "delivery-address",
  "delivery-date", "delivery-time", "delivery-mode", "cake-name", "occasion",
] as const;

/**
 * Every problem with the form at once, keyed by field id, so each field can show its own message.
 * (validateOrder above stays as the single-message safety net.)
 */
export const getFieldErrors = (f: OrderForm, now: Date = new Date()): Record<string, string> => {
  const e: Record<string, string> = {};
  const mobile = "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.";
  if (!f.name.trim()) e["name"] = "Please enter your name.";
  if (!f.address.trim()) e["address"] = "Please enter your address.";
  if (!f.phone.trim()) e["phone"] = "Please enter your phone number.";
  else if (!validatePhoneNumber(f.phone.trim())) e["phone"] = mobile;
  if (f.orderingForSomeone === "yes") {
    if (!f.deliveryPhone.trim()) e["delivery-phone"] = "Please enter the recipient's phone number.";
    else if (!validatePhoneNumber(f.deliveryPhone.trim())) e["delivery-phone"] = mobile;
    if (!f.deliveryName.trim()) e["delivery-name"] = "Please enter the recipient's name.";
    if (!f.deliveryAddress.trim()) e["delivery-address"] = "Please enter the delivery address.";
  }
  if (!f.deliveryDate) e["delivery-date"] = "Please choose a delivery date.";
  if (!f.deliveryTime) e["delivery-time"] = "Please choose a delivery time.";
  if (f.deliveryDate && f.deliveryTime && new Date(`${f.deliveryDate}T${f.deliveryTime}`) < earliestDelivery(now))
    e["delivery-time"] = `Please pick a time at least ${site.leadTimeHours} hours from now.`;
  if (!f.deliveryMode) e["delivery-mode"] = "Please choose home delivery or pick up.";
  if (!f.cakeName.trim()) e["cake-name"] = "Please tell us the name to write on the cake.";
  if (!f.occasion.trim()) e["occasion"] = "Please tell us the occasion.";
  return e;
};

/** Advance to pay now, in rupees (same rounding as the amount quoted in the WhatsApp message). */
export const advanceAmount = (total: number) => Math.round((total * site.advancePercent) / 100);
