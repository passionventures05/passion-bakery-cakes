"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import BorderDivider from "@/components/BorderDivider";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/useToast";
import { cartTotal } from "@/lib/cart";
import { isMobileDevice, openExternalUrl, openWhatsApp } from "@/lib/external";
import { formatRupees } from "@/lib/format";
import { getCachedProducts, setCachedProducts } from "@/lib/products";
import { site } from "@/lib/site";
import { useCart } from "@/lib/useCart";
import { digitsOnly, earliestDelivery, toDateInput, toTimeInput } from "@/lib/validation";
import type { Product } from "@/types";
import {
  ORDER_FIELD_ORDER,
  OrderForm,
  advanceAmount,
  buildDelivery,
  emptyOrderForm,
  generateWhatsAppMessage,
  getCartDetails,
  getFieldErrors,
  validateOrder,
} from "./orderMessage";
import "@/styles/cart.css";
import "@/styles/luxe-cart.css";

type Stage = "form" | "pay" | "sent" | "done";

const STEPS = ["Cart", "Details", "Pay advance", "Send"];

export default function CartView() {
  const { cart, ready, setItem, removeKey, clear } = useCart();
  const { toast, element: toastEl } = useToast();
  const [form, setForm] = useState<OrderForm>({ ...emptyOrderForm, orderingForSomeone: "no" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [showQr, setShowQr] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [minDT, setMinDT] = useState<Date | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const lastMessage = useRef("");
  const topRef = useRef<HTMLDivElement>(null);

  const entries = Object.entries(cart).filter(([, i]) => i.quantity > 0);
  const hasItems = entries.length > 0;
  const total = cartTotal(cart);
  const advance = advanceAmount(total);

  const set = <K extends keyof OrderForm>(key: K, value: OrderForm[K], errorId?: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errorId) clearError(errorId);
  };
  const clearError = (id: string) =>
    setErrors((e) => {
      if (!e[id]) return e;
      const { [id]: _removed, ...rest } = e;
      void _removed;
      return rest;
    });
  const aria = (id: string) => ({
    "aria-invalid": errors[id] ? (true as const) : undefined,
    "aria-describedby": errors[id] ? `err-${id}` : undefined,
  });
  const fieldError = (id: string) =>
    errors[id] ? (
      <p className="lx-field-error on-light" id={`err-${id}`} role="alert">
        <Icon name="exclamation-triangle" /> {errors[id]}
      </p>
    ) : null;

  // thumbnails for the cart cards
  useEffect(() => {
    let alive = true;
    const map = (all: Product[]) => {
      const m: Record<string, string> = {};
      all.forEach((p) => p.image && (m[p.name] = p.image));
      if (alive) setImages(m);
    };
    const cached = getCachedProducts();
    if (cached?.length) return map(cached);
    fetch("/cake_products.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Product[]) => {
        setCachedProducts(data);
        map(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setMobile(isMobileDevice());
    setShowQr(!isMobileDevice());
  }, []);

  // minimum delivery date/time (lead time), refreshed every minute
  useEffect(() => {
    const tick = () => setMinDT(earliestDelivery());
    tick();
    const id = window.setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  const minDateStr = minDT ? toDateInput(minDT) : undefined;
  const minTimeStr = minDT ? toTimeInput(minDT) : undefined;

  useEffect(() => {
    if (minDateStr && form.deliveryDate && form.deliveryDate < minDateStr) {
      setForm((f) => ({ ...f, deliveryDate: "", deliveryTime: "" }));
    }
  }, [minDateStr, form.deliveryDate]);

  const onDateChange = (value: string) => {
    clearError("delivery-date");
    if (!value || !minDT || !minDateStr || !minTimeStr) return set("deliveryDate", value);
    if (value === minDateStr) {
      setForm((f) => ({
        ...f,
        deliveryDate: value,
        deliveryTime: f.deliveryTime && f.deliveryTime < minTimeStr ? "" : f.deliveryTime,
      }));
    } else if (new Date(`${value}T00:00:00`) > new Date(`${minDateStr}T00:00:00`)) {
      set("deliveryDate", value);
    } else {
      setForm((f) => ({ ...f, deliveryDate: "", deliveryTime: "" }));
      setErrors((e) => ({ ...e, "delivery-date": `Please choose a date at least ${site.leadTimeHours} hours from now.` }));
    }
  };

  const onTimeChange = (value: string) => {
    clearError("delivery-time");
    if (form.deliveryDate && value && new Date(`${form.deliveryDate}T${value}`) < earliestDelivery()) {
      setErrors((e) => ({ ...e, "delivery-time": `Please pick a time at least ${site.leadTimeHours} hours from now.` }));
      return set("deliveryTime", "");
    }
    set("deliveryTime", value);
  };

  const onOrderingForChange = (value: OrderForm["orderingForSomeone"]) => {
    setForm((f) =>
      value === "yes"
        ? { ...f, orderingForSomeone: value }
        : { ...f, orderingForSomeone: value, deliveryPhone: "", deliveryName: "", deliveryAddress: "" }
    );
    ["delivery-phone", "delivery-name", "delivery-address"].forEach(clearError);
  };

  const changeQty = (key: string, delta: number) => {
    const item = cart[key];
    if (!item) return;
    const { quantity, ...rest } = item;
    setItem(rest, quantity + delta);
  };

  const toTop = () =>
    window.setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);

  /** Step 2 → 3: check the form, then show the advance payment. */
  const continueToPayment = () => {
    const found = getFieldErrors(form);
    if (Object.keys(found).length) {
      setErrors(found);
      setSummary("Please check the highlighted fields.");
      const first = ORDER_FIELD_ORDER.find((id) => found[id]);
      const el = first ? document.getElementById(first) : null;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => el?.focus({ preventScroll: true }), 350);
      return;
    }
    const guard = validateOrder(form, buildDelivery(form));
    if (guard) {
      setSummary(guard);
      return;
    }
    setErrors({});
    setSummary("");
    setStage("pay");
    toTop();
  };

  /** Step 3 → 4: open WhatsApp with the order. The cart is kept until the customer confirms they sent it. */
  const sendOrder = async () => {
    const delivery = buildDelivery(form);
    const problem = validateOrder(form, delivery);
    if (problem) {
      setErrors(getFieldErrors(form));
      setSummary(problem);
      setStage("form");
      toTop();
      return;
    }
    lastMessage.current = generateWhatsAppMessage(form, delivery, getCartDetails(cart));
    setStage("sent");
    toTop();
    try {
      await openWhatsApp(lastMessage.current);
    } catch (error) {
      console.error("Could not open WhatsApp:", error);
      toast(`We couldn't open WhatsApp. Please message us directly on ${site.phoneDisplay}.`);
    }
  };

  const reopenWhatsApp = async () => {
    try {
      await openWhatsApp(lastMessage.current);
    } catch {
      toast(`We couldn't open WhatsApp. Please message us directly on ${site.phoneDisplay}.`);
    }
  };

  const confirmSent = () => {
    clear();
    setStage("done");
    toTop();
  };

  const upiLink = useMemo(
    () =>
      `upi://pay?pa=${encodeURIComponent(site.upiId)}&pn=${encodeURIComponent(site.name)}&am=${advance}&cu=INR&tn=${encodeURIComponent("Advance for cake order")}`,
    [advance]
  );

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(site.upiId);
      toast("UPI ID copied");
    } catch {
      toast(`Our UPI ID is ${site.upiId}`);
    }
  };

  const stepIndex = stage === "form" ? 1 : stage === "pay" ? 2 : 3;
  const showEmpty = ready && !hasItems && stage !== "done" && stage !== "sent";

  return (
    <div className="site page-cart">
      <Navbar active="cart" />
      {toastEl}
      <main id="main" tabIndex={-1}>
        <div ref={topRef} className="lx-scroll-anchor" />
        <div className="lx-head" data-reveal="">
          <span className="lx-eyebrow">Almost there</span>
          <h1 className="lx-title">Your Cart</h1>
        </div>

        {/* Progress */}
        {!showEmpty && (
          <ol className="lx-progress" aria-label="Checkout progress">
            {STEPS.map((label, i) => (
              <li
                key={label}
                className={i < stepIndex || stage === "done" ? "done" : i === stepIndex ? "current" : ""}
                aria-current={i === stepIndex && stage !== "done" ? "step" : undefined}
              >
                <span className="lx-progress-dot">{i < stepIndex || stage === "done" ? <Icon name="check" /> : i + 1}</span>
                <span className="lx-progress-label">{label}</span>
              </li>
            ))}
          </ol>
        )}

        {/* Empty cart */}
        {showEmpty && (
          <div className="empty-cart" id="empty-cart" style={{ display: "block" }}>
            <div className="empty-cart-icon"><Icon name="shopping-cart" /></div>
            <h2>Your Cart is Empty</h2>
            <p>Add some delicious cakes to your cart to see the total and proceed to checkout.</p>
            <Link href="/products/" className="lx-btn lx-btn-primary">
              <Icon name="shopping-bag" /> Start Shopping
            </Link>
          </div>
        )}

        {/* Step 1: cart */}
        {hasItems && (stage === "form" || stage === "pay") && (
          <section className="lx-panel" id="cart-section" aria-labelledby="cart-heading">
            <h2 id="cart-heading" className="lx-panel-title">Your Selection</h2>
            <ul className="lx-cart-list">
              {entries.map(([key, item]) => (
                <li key={key} className="lx-cart-item">
                  <img src={images[item.name] || "/cake-600.webp"} alt="" width={84} height={84} loading="lazy" />
                  <div className="lx-cart-info">
                    <strong>{item.name}</strong>
                    <span>{item.label} · {formatRupees(item.unitPrice)} each</span>
                    {stage === "form" ? (
                      <div className="lx-qty" role="group" aria-label={`Quantity of ${item.name} (${item.label})`}>
                        <button type="button" aria-label={`Decrease quantity of ${item.name} (${item.label})`} onClick={() => changeQty(key, -1)}><Icon name="minus" /></button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button type="button" aria-label={`Increase quantity of ${item.name} (${item.label})`} onClick={() => changeQty(key, 1)}><Icon name="plus" /></button>
                      </div>
                    ) : (
                      <span>Quantity: {item.quantity}</span>
                    )}
                  </div>
                  <div className="lx-cart-side">
                    <span className="lx-cart-line">{formatRupees(item.unitPrice * item.quantity)}</span>
                    {stage === "form" && (
                      <button type="button" className="lx-remove" aria-label={`Remove ${item.name} (${item.label}) from cart`} onClick={() => removeKey(key)}>
                        <Icon name="trash" /> Remove
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <dl className="lx-totals">
              <div><dt>Total Amount</dt><dd id="total-amount">{formatRupees(total)}</dd></div>
              <div className="advance"><dt>Advance to confirm ({site.advancePercent}%)</dt><dd>{formatRupees(advance)}</dd></div>
              <div><dt>Balance on delivery / pick-up</dt><dd>{formatRupees(total - advance)}</dd></div>
            </dl>
            {stage === "form" && (
              <p className="lx-note"><Link href="/products/">← Continue shopping</Link></p>
            )}
          </section>
        )}

        {/* Step 2: details */}
        {hasItems && stage === "form" && (
          <section className="lx-panel" id="payment-form" aria-labelledby="details-heading">
            <h2 id="details-heading" className="lx-panel-title">Your Details &amp; Delivery</h2>
            <p className="lx-panel-sub">
              Tell us who the cake is for and when you need it. We need at least {site.leadTimeHours} hours&apos; notice.
            </p>

            {summary && (
              <p className="lx-form-summary" role="alert">
                <Icon name="exclamation-triangle" /> {summary}
              </p>
            )}

            <form id="order-form" className="lx-form" onSubmit={(e) => { e.preventDefault(); continueToPayment(); }} noValidate>
              <fieldset>
                <legend>About you</legend>
                <div className="form-group">
                  <label htmlFor="name">Your name</label>
                  <input type="text" id="name" name="name" placeholder="Enter your full name" autoComplete="name" {...aria("name")}
                    value={form.name} onChange={(e) => set("name", e.target.value, "name")} />
                  {fieldError("name")}
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone number</label>
                  <input type="tel" id="phone" name="phone" placeholder="10-digit mobile number" autoComplete="tel-national" inputMode="numeric" maxLength={10} {...aria("phone")}
                    value={form.phone} onChange={(e) => set("phone", digitsOnly(e.target.value), "phone")} />
                  {fieldError("phone")}
                </div>
                <div className="form-group wide">
                  <label htmlFor="address">Your address</label>
                  <input type="text" id="address" name="address" placeholder="Enter your complete address" autoComplete="street-address" {...aria("address")}
                    value={form.address} onChange={(e) => set("address", e.target.value, "address")} />
                  {fieldError("address")}
                </div>
              </fieldset>

              <fieldset>
                <legend>Delivery</legend>
                <div className="form-group wide">
                  <label htmlFor="ordering-for-someone">Are you ordering for someone else?</label>
                  <select id="ordering-for-someone" name="ordering-for-someone" value={form.orderingForSomeone}
                    onChange={(e) => onOrderingForChange(e.target.value as OrderForm["orderingForSomeone"])}>
                    <option value="no">No, it&apos;s for me</option>
                    <option value="yes">Yes, it&apos;s a gift</option>
                  </select>
                </div>

                {form.orderingForSomeone === "yes" && (
                  <div className="lx-gift wide" id="conditional-delivery-fields">
                    <div className="form-group">
                      <label htmlFor="delivery-name">Recipient&apos;s name</label>
                      <input type="text" id="delivery-name" name="delivery-name" placeholder="Enter recipient's name" {...aria("delivery-name")}
                        value={form.deliveryName} onChange={(e) => set("deliveryName", e.target.value, "delivery-name")} />
                      {fieldError("delivery-name")}
                    </div>
                    <div className="form-group">
                      <label htmlFor="delivery-phone">Recipient&apos;s phone</label>
                      <input type="tel" id="delivery-phone" name="delivery-phone" placeholder="10-digit mobile number" inputMode="numeric" maxLength={10} {...aria("delivery-phone")}
                        value={form.deliveryPhone} onChange={(e) => set("deliveryPhone", digitsOnly(e.target.value), "delivery-phone")} />
                      {fieldError("delivery-phone")}
                    </div>
                    <div className="form-group wide">
                      <label htmlFor="delivery-address">Delivery address</label>
                      <input type="text" id="delivery-address" name="delivery-address" placeholder="Enter delivery address" {...aria("delivery-address")}
                        value={form.deliveryAddress} onChange={(e) => set("deliveryAddress", e.target.value, "delivery-address")} />
                      {fieldError("delivery-address")}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="delivery-date">Date (at least {site.leadTimeHours} hours from now)</label>
                  <input type="date" id="delivery-date" name="delivery-date" min={minDateStr} {...aria("delivery-date")}
                    value={form.deliveryDate} onChange={(e) => onDateChange(e.target.value)} />
                  {fieldError("delivery-date")}
                </div>
                <div className="form-group">
                  <label htmlFor="delivery-time">Time</label>
                  <input type="time" id="delivery-time" name="delivery-time" {...aria("delivery-time")}
                    min={form.deliveryDate && form.deliveryDate === minDateStr ? minTimeStr : undefined}
                    value={form.deliveryTime} onChange={(e) => onTimeChange(e.target.value)} />
                  {fieldError("delivery-time")}
                </div>
                <div className="form-group wide">
                  <label htmlFor="delivery-mode">Home delivery or pick up?</label>
                  <select id="delivery-mode" name="delivery-mode" value={form.deliveryMode} {...aria("delivery-mode")}
                    onChange={(e) => set("deliveryMode", e.target.value as OrderForm["deliveryMode"], "delivery-mode")}>
                    <option value="" disabled>Select an option</option>
                    <option value="home-delivery">Home Delivery</option>
                    <option value="pick-up">Pick Up</option>
                  </select>
                  {fieldError("delivery-mode")}
                </div>
              </fieldset>

              <fieldset>
                <legend>Your cake</legend>
                <div className="form-group">
                  <label htmlFor="cake-name">Name on cake</label>
                  <input type="text" id="cake-name" name="cake-name" placeholder="Name to be written on cake" {...aria("cake-name")}
                    value={form.cakeName} onChange={(e) => set("cakeName", e.target.value, "cake-name")} />
                  {fieldError("cake-name")}
                </div>
                <div className="form-group">
                  <label htmlFor="occasion">Occasion</label>
                  <input type="text" id="occasion" name="occasion" placeholder="e.g. Birthday, Anniversary" {...aria("occasion")}
                    value={form.occasion} onChange={(e) => set("occasion", e.target.value, "occasion")} />
                  {fieldError("occasion")}
                </div>
                <div className="form-group wide">
                  <label htmlFor="special-request">Anything else we should know? <span className="opt">(optional)</span></label>
                  <textarea id="special-request" name="special-request" placeholder="Allergies, design wishes, message on the card…"
                    value={form.specialRequest} onChange={(e) => set("specialRequest", e.target.value)}></textarea>
                </div>
              </fieldset>

              <div className="lx-actions">
                <button type="submit" className="lx-btn lx-btn-primary">
                  Continue to Payment <Icon name="arrow-right" />
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Step 3: pay the advance */}
        {hasItems && stage === "pay" && (
          <section className="lx-panel lx-pay" id="payment-methods" aria-labelledby="pay-heading">
            <h2 id="pay-heading" className="lx-panel-title">Pay Your Advance</h2>
            <p className="lx-panel-sub">
              Pay <strong>{site.advancePercent}%</strong> of your total to confirm your order, then send it to us on WhatsApp together with a screenshot of the payment.
            </p>

            <div className="lx-pay-amount">
              <span>Advance to pay now</span>
              <strong>{formatRupees(advance)}</strong>
              <small>of {formatRupees(total)} · balance {formatRupees(total - advance)} on delivery / pick-up</small>
            </div>

            <div className="lx-pay-methods">
              {mobile && (
                <button type="button" className="lx-btn lx-btn-primary" onClick={() => openExternalUrl(upiLink)}>
                  <Icon name="mobile" /> Pay {formatRupees(advance)} with a UPI app
                </button>
              )}
              <div className="lx-upi">
                <span>UPI ID</span>
                <code id="upi-id">{site.upiId}</code>
                <button type="button" className="lx-btn lx-btn-light lx-btn-sm" onClick={copyUpi}><Icon name="copy" /> Copy</button>
              </div>
              <button type="button" className="lx-btn lx-btn-light" aria-expanded={showQr} onClick={() => setShowQr((v) => !v)}>
                <Icon name="qrcode" /> {showQr ? "Hide QR code" : "Show QR code"}
              </button>
              {showQr && <img id="qr-code" src="/qr code.jpg" alt={`UPI QR code for ${site.name}`} />}
            </div>

            <div className="lx-actions split">
              <button type="button" className="lx-btn lx-btn-outline-dark" onClick={() => { setStage("form"); toTop(); }}>
                <Icon name="chevron-left" /> Edit details
              </button>
              <button type="button" className="lx-btn lx-btn-primary" onClick={sendOrder}>
                <Icon name="whatsapp" /> Send Order on WhatsApp
              </button>
            </div>
            <p className="lx-note">Paid already? Tap &ldquo;Send Order on WhatsApp&rdquo; and attach your payment screenshot in the chat.</p>
          </section>
        )}

        {/* Step 4: waiting for the WhatsApp send */}
        {stage === "sent" && (
          <section className="lx-panel lx-result" id="success-section" aria-live="polite">
            <div className="lx-result-icon"><Icon name="whatsapp" /></div>
            <h2 className="lx-panel-title">Almost done — send it on WhatsApp</h2>
            <p className="lx-panel-sub">
              We&apos;ve opened WhatsApp with your order. <strong>Press Send there</strong> and attach your payment screenshot so we can confirm your order. Your cart is kept safe until you tell us it&apos;s sent.
            </p>
            <div className="lx-actions column">
              <button type="button" className="lx-btn lx-btn-primary" onClick={reopenWhatsApp}>
                <Icon name="whatsapp" /> Open WhatsApp again
              </button>
              <button type="button" className="lx-btn lx-btn-light" onClick={confirmSent}>
                <Icon name="check-circle" /> I&apos;ve sent it — clear my cart
              </button>
              <button type="button" className="lx-link dark" onClick={() => { setStage("form"); toTop(); }}>Change my order details</button>
            </div>
          </section>
        )}

        {/* Done */}
        {stage === "done" && (
          <section className="lx-panel lx-result" id="order-complete">
            <div className="lx-result-icon"><Icon name="check-circle" /></div>
            <h2 className="lx-panel-title">Thank you!</h2>
            <p className="lx-panel-sub">
              We&apos;ll check your order and payment and confirm with you on WhatsApp shortly. We can&apos;t wait to bake for your celebration.
            </p>
            <div className="lx-actions column">
              <Link href="/products/" className="lx-btn lx-btn-primary">Order another cake</Link>
              <Link href="/" className="lx-btn lx-btn-light">Back to home</Link>
            </div>
          </section>
        )}

        <BorderDivider />
      </main>
      <Footer />
    </div>
  );
}
