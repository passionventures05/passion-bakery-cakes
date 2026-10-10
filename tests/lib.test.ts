import { describe, expect, it } from "vitest";
// @ts-ignore plain ESM helper without types
import { buildCatalogue } from "../scripts/products-lib.mjs";
import { cartItemCount, cartKey, cartTotal } from "@/lib/cart";
import { formatAmount, formatRupees } from "@/lib/format";
import { buildSizeOptions, calculatePrice, calculateServing, parseQuantity } from "@/lib/products";
import { site } from "@/lib/site";
import { validatePhoneNumber } from "@/lib/validation";
import { advanceAmount, buildDelivery, emptyOrderForm, generateWhatsAppMessage, getCartDetails, getFieldErrors, validateOrder } from "@/components/cart/orderMessage";
import type { CartData, Product } from "@/types";

const cake: Product = { name: "Test", baseQuantity: "500gm", basePrice: 699, category: "Chocolate", availableQuantities: "500gm,1kg,1.5kg,2kg", description: "" };

describe("parseQuantity", () => {
  it("understands weights and pieces", () => {
    expect(parseQuantity("500gm")).toEqual({ amount: 500, unit: "g" });
    expect(parseQuantity("500g")).toEqual({ amount: 500, unit: "g" });
    expect(parseQuantity("1.5 kg")).toEqual({ amount: 1500, unit: "g" });
    expect(parseQuantity("3pc")).toEqual({ amount: 3, unit: "pc" });
    expect(parseQuantity("3")).toEqual({ amount: 3, unit: "pc" });
    expect(parseQuantity("500")).toEqual({ amount: 500, unit: "g" });
    expect(parseQuantity("abc")).toBeNull();
    expect(parseQuantity("")).toBeNull();
  });
});

describe("pricing", () => {
  it("scales by size and rounds to whole rupees", () => {
    expect(calculatePrice(699, 500, 1000)).toBe(1398);
    expect(calculatePrice(699, 500, 1500)).toBe(2097);
    expect(calculatePrice(349, 500, 750)).toBe(524); // 523.5 -> 524
  });
  it("builds sorted, de-duplicated options", () => {
    const opts = buildSizeOptions({ ...cake, availableQuantities: "1kg, 500g,1kg,,2kg," });
    expect(opts.map((o) => o.label)).toEqual(["500 g", "1 kg", "2 kg"]);
    expect(opts.map((o) => o.price)).toEqual([699, 1398, 2796]);
  });
  it("handles per-piece products", () => {
    const opts = buildSizeOptions({ ...cake, baseQuantity: "1pc", basePrice: 349, availableQuantities: "1pc,3pc,5pc,7pc" });
    expect(opts.map((o) => o.label)).toEqual(["1 piece", "3 pieces", "5 pieces", "7 pieces"]);
    expect(opts.map((o) => o.price)).toEqual([349, 1047, 1745, 2443]);
  });
  it("every product in the catalogue yields valid options", () => {
    const { catalogue } = buildCatalogue("content/products", "public") as { catalogue: Product[] };
    for (const p of catalogue) {
      const opts = buildSizeOptions(p);
      expect(opts.length, p.name).toBeGreaterThan(0);
      opts.forEach((o) => expect(o.price, p.name).toBeGreaterThan(0));
    }
  });
});

describe("formatting", () => {
  it("formats rupees and amounts", () => {
    expect(formatRupees(1049)).toBe("₹1,049");
    expect(formatRupees(123456)).toBe("₹1,23,456");
    expect(formatAmount(500, "g")).toBe("500 g");
    expect(formatAmount(1000, "g")).toBe("1 kg");
    expect(formatAmount(1500, "g")).toBe("1.5 kg");
    expect(formatAmount(1, "pc")).toBe("1 piece");
    expect(calculateServing(1000, "g")).toBe("7-9 people");
  });
});

describe("cart", () => {
  const cart: CartData = {
    [cartKey("A", 500, "g")]: { name: "A", amount: 500, unit: "g", label: "500 g", unitPrice: 699, quantity: 2 },
    [cartKey("A", 1000, "g")]: { name: "A", amount: 1000, unit: "g", label: "1 kg", unitPrice: 1398, quantity: 1 },
  };
  it("keeps the same cake in several sizes", () => {
    expect(Object.keys(cart)).toHaveLength(2);
    expect(cartItemCount(cart)).toBe(3);
    expect(cartTotal(cart)).toBe(2796);
  });
});

describe("order validation", () => {
  const now = new Date("2026-10-01T10:00:00");
  const base = { ...emptyOrderForm, name: "Asha", address: "Andheri", phone: "9876543210", orderingForSomeone: "no" as const, cakeName: "Riya", occasion: "Birthday", deliveryMode: "pick-up" as const };
  const delivery = { phone: "9876543210", name: "Asha", address: "Andheri" };

  it("validates Indian mobile numbers", () => {
    expect(validatePhoneNumber("9876543210")).toBe(true);
    expect(validatePhoneNumber("5876543210")).toBe(false);
    expect(validatePhoneNumber("98765")).toBe(false);
  });
  it("enforces the lead time", () => {
    expect(validateOrder({ ...base, deliveryDate: "2026-10-02", deliveryTime: "12:00" }, delivery, now)).toMatch(/at least 36 hours/);
    expect(validateOrder({ ...base, deliveryDate: "2026-10-03", deliveryTime: "12:00" }, delivery, now)).toBeNull();
  });
  it("requires recipient details when ordering for someone else", () => {
    const f = { ...base, orderingForSomeone: "yes" as const, deliveryDate: "2026-10-05", deliveryTime: "12:00" };
    expect(validateOrder(f, { phone: "", name: "", address: "" }, now)).toMatch(/delivery details/);
  });
  it("rejects bad customer phone", () => {
    expect(validateOrder({ ...base, phone: "12345", deliveryDate: "2026-10-05", deliveryTime: "12:00" }, delivery, now)).toMatch(/valid 10-digit/);
  });
});

describe("WhatsApp message", () => {
  it("is on-brand and has the totals", () => {
    const cart: CartData = { x: { name: "Strawberry Cheese Cake", amount: 3, unit: "pc", label: "3 pieces", unitPrice: 1047, quantity: 2 } };
    const msg = generateWhatsAppMessage(
      { ...emptyOrderForm, name: "Asha", address: "Andheri", phone: "9876543210", deliveryDate: "2026-10-05", deliveryTime: "12:00", deliveryMode: "home-delivery", cakeName: "Riya", occasion: "Birthday" },
      { phone: "9876543210", name: "Asha", address: "Andheri" },
      getCartDetails(cart)
    );
    expect(msg).toContain(site.name.toUpperCase());
    expect(msg).not.toContain("🍫");
    expect(msg).toContain("Strawberry Cheese Cake (3 pieces) x 2 = ₹2,094");
    expect(msg).toContain("Total Amount: ₹2,094");
    expect(msg).toContain("₹1,047"); // 50% advance
  });
});

describe("site config", () => {
  it("uses the confirmed phone number", () => {
    expect(site.phone).toBe("7365887555");
    expect(site.whatsappNumber).toBe("917365887555");
  });
});

describe("checkout helpers", () => {
  it("advance is the configured percentage of the total", () => {
    expect(advanceAmount(2094)).toBe(1047);
    expect(advanceAmount(699)).toBe(Math.round((699 * site.advancePercent) / 100));
  });

  it("reports every missing field at once, keyed by field id", () => {
    const errors = getFieldErrors({ ...emptyOrderForm });
    for (const id of ["name", "address", "phone", "delivery-date", "delivery-time", "delivery-mode", "cake-name", "occasion"]) {
      expect(errors[id], id).toBeTruthy();
    }
    expect(errors["delivery-phone"]).toBeUndefined(); // only needed when ordering for someone else
  });

  it("is clean for a complete order and flags a too-soon delivery time", () => {
    const now = new Date("2030-01-10T09:00:00");
    const ok = { ...emptyOrderForm, name: "Asha", address: "Andheri", phone: "9876543210", deliveryDate: "2030-01-15", deliveryTime: "12:00", deliveryMode: "home-delivery" as const, cakeName: "Riya", occasion: "Birthday" };
    expect(getFieldErrors(ok, now)).toEqual({});
    expect(getFieldErrors({ ...ok, deliveryDate: "2030-01-10", deliveryTime: "10:00" }, now)["delivery-time"]).toMatch(/hours/);
  });

  it("sends gifts to the recipient, not the buyer", () => {
    const f = { ...emptyOrderForm, name: "Asha", phone: "9876543210", address: "A", orderingForSomeone: "yes" as const, deliveryName: "Riya", deliveryPhone: "9123456780", deliveryAddress: "B" };
    expect(buildDelivery(f)).toEqual({ name: "Riya", phone: "9123456780", address: "B" });
    expect(getFieldErrors({ ...f, deliveryPhone: "" })["delivery-phone"]).toBeTruthy();
  });

  it("keeps UPI and featured-cake settings in one place", () => {
    expect(site.upiId).toContain("@");
    expect(site.featured.length).toBeGreaterThanOrEqual(3);
  });
});
