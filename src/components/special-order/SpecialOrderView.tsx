"use client";

import { useEffect, useRef, useState } from "react";
import BorderDivider from "@/components/BorderDivider";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/useToast";
import { openWhatsApp } from "@/lib/external";
import { site } from "@/lib/site";
import { digitsOnly, earliestDelivery, toDateInput, validatePhoneNumber } from "@/lib/validation";
import "@/styles/special-order.css";
import "@/styles/luxe-special-order.css";

const MIN_WEIGHT = 2.5;
const STEP = 0.5;
const STEPS = ["Your cake", "Delivery", "Your details"];

interface FormState {
  name: string;
  phone: string;
  address: string;
  deliveryDate: string;
  deliveryMode: string;
  occasion: string;
  flavour: string;
  specialDesign: string;
  nameOnCake: "no" | "yes";
  cakeName: string;
  specialRequest: string;
}

const initial: FormState = {
  name: "",
  phone: "",
  address: "",
  deliveryDate: "",
  deliveryMode: "",
  occasion: "",
  flavour: "",
  specialDesign: "",
  nameOnCake: "no",
  cakeName: "",
  specialRequest: "",
};

const MODE_LABEL: Record<string, string> = { pickup: "Pickup", "to-go": "Home Delivery" };

/** What is wrong on each step, keyed by field id. */
const stepErrors = (step: number, f: FormState): Record<string, string> => {
  const e: Record<string, string> = {};
  if (step === 0) {
    if (!f.occasion.trim()) e["occasion"] = "Please tell us the occasion.";
    if (!f.flavour.trim()) e["flavour"] = "Please tell us the flavour you would like.";
    if (f.nameOnCake === "yes" && !f.cakeName.trim()) e["cake-name"] = "Please type the name to write on the cake.";
  }
  if (step === 1) {
    if (!f.deliveryDate) e["delivery-date"] = "Please choose a delivery date.";
    else if (f.deliveryDate < toDateInput(earliestDelivery()))
      e["delivery-date"] = `Please choose a date at least ${site.leadTimeHours} hours from now.`;
    if (!f.deliveryMode) e["delivery-mode"] = "Please choose pickup or home delivery.";
    if (!f.address.trim()) e["address"] = "Please enter your complete address.";
  }
  if (step === 2) {
    if (!f.name.trim()) e["name"] = "Please enter your name.";
    if (!f.phone.trim()) e["phone"] = "Please enter your phone number.";
    else if (!validatePhoneNumber(f.phone.trim()))
      e["phone"] = "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.";
  }
  return e;
};

export default function SpecialOrderView() {
  const [form, setForm] = useState<FormState>(initial);
  const [weight, setWeight] = useState(MIN_WEIGHT);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [minDate, setMinDate] = useState<string | undefined>(undefined);
  const cakeNameRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const lastMessage = useRef("");
  const { toast, element: toastEl } = useToast();

  useEffect(() => setMinDate(toDateInput(earliestDelivery())), []);

  // arriving from "Shop by occasion" on the home page: /special-order/?occasion=Birthday
  useEffect(() => {
    const occasion = new URLSearchParams(window.location.search).get("occasion");
    if (occasion) setForm((f) => (f.occasion ? f : { ...f, occasion: occasion.slice(0, 60) }));
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K], errorId?: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errorId)
      setErrors((e) => {
        if (!e[errorId]) return e;
        const { [errorId]: _removed, ...rest } = e;
        void _removed;
        return rest;
      });
  };

  const aria = (id: string) => ({
    "aria-invalid": errors[id] ? (true as const) : undefined,
    "aria-describedby": errors[id] ? `err-${id}` : undefined,
  });
  const fieldError = (id: string) =>
    errors[id] ? (
      <p className="lx-field-error" id={`err-${id}`} role="alert">
        <Icon name="exclamation-triangle" /> {errors[id]}
      </p>
    ) : null;

  const onNameOnCakeChange = (value: "no" | "yes") => {
    if (value === "yes") {
      set("nameOnCake", value);
      window.setTimeout(() => cakeNameRef.current?.focus(), 0);
    } else {
      setForm((f) => ({ ...f, nameOnCake: value, cakeName: "" }));
      setErrors((e) => {
        const { "cake-name": _r, ...rest } = e;
        void _r;
        return rest;
      });
    }
  };

  const goTo = (n: number) => {
    setStep(n);
    setErrors({});
    window.setTimeout(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      headingRef.current?.focus({ preventScroll: true });
    }, 60);
  };

  const focusFirst = (found: Record<string, string>) => {
    const id = Object.keys(found)[0];
    const el = id ? document.getElementById(id) : null;
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => el?.focus({ preventScroll: true }), 300);
  };

  const next = () => {
    const found = stepErrors(step, form);
    if (Object.keys(found).length) {
      setErrors(found);
      return focusFirst(found);
    }
    goTo(step + 1);
  };

  const buildMessage = () => {
    const data = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      weight: weight.toFixed(1),
      deliveryDate: form.deliveryDate,
      deliveryMode: MODE_LABEL[form.deliveryMode] ?? form.deliveryMode,
      occasion: form.occasion.trim(),
      flavour: form.flavour.trim(),
      specialDesign: form.specialDesign.trim() || "No special design requirements",
      nameOnCake: form.nameOnCake === "yes" ? form.cakeName.trim() : "No",
      specialRequest: form.specialRequest.trim() || "None",
    };
    return (
      `🍰 *${site.name} - Special Cake Order* 🍰\n\n` +
      `👤 Name: ${data.name}\n` +
      `📞 Phone: ${data.phone}\n` +
      `📍 Address: ${data.address}\n` +
      `⚖️ Weight: ${data.weight} kg\n` +
      `📅 Delivery Date: ${data.deliveryDate}\n` +
      `🚚 Delivery Mode: ${data.deliveryMode}\n` +
      `🎉 Occasion: ${data.occasion}\n` +
      `🍴 Flavour: ${data.flavour}\n` +
      `🎨 Special Design: ${data.specialDesign}\n` +
      `✏️ Name on Cake: ${data.nameOnCake}\n` +
      `💭 Special Request: ${data.specialRequest}\n\n` +
      `📸 *Please send any reference images for the design in your next message*`
    );
  };

  const openChat = async () => {
    try {
      await openWhatsApp(lastMessage.current);
    } catch {
      toast(`We couldn't open WhatsApp. Please message us directly on ${site.phoneDisplay}.`);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) return next();

    // re-check every step before sending (the date may have passed while the form was open)
    for (let s = 0; s <= 2; s++) {
      const found = stepErrors(s, form);
      if (Object.keys(found).length) {
        goTo(s);
        window.setTimeout(() => {
          setErrors(found);
          focusFirst(found);
        }, 120);
        return;
      }
    }
    lastMessage.current = buildMessage();
    setSent(true);
    window.setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    void openChat();
  };

  const startOver = () => {
    setForm(initial);
    setWeight(MIN_WEIGHT);
    setSent(false);
    setErrors({});
    setStep(0);
  };

  const modeText = MODE_LABEL[form.deliveryMode] ?? "";

  return (
    <div className="site page-special-order">
      <Navbar active="special-order" />
      {toastEl}
      <main id="main" tabIndex={-1}>
        <div ref={topRef} className="lx-scroll-anchor" />
        <div className="lx-head on-light" data-reveal="">
          <span className="lx-eyebrow">Made just for you</span>
          <h1 className="lx-title">Design Your Dream Cake</h1>
          <p className="lx-sub">Tell us your vision in three quick steps. We&apos;ll confirm the design and final price on WhatsApp.</p>
        </div>

        {!sent && (
          <ol className="lx-progress" aria-label="Order progress">
            {STEPS.map((label, i) => (
              <li key={label} className={i < step ? "done" : i === step ? "current" : ""} aria-current={i === step ? "step" : undefined}>
                <span className="lx-progress-dot">{i < step ? <Icon name="check" /> : i + 1}</span>
                <span className="lx-progress-label">{label}</span>
              </li>
            ))}
          </ol>
        )}

        <div className="container">
          {sent ? (
            <div className="lx-so-result" aria-live="polite">
              <div className="lx-so-result-icon"><Icon name="whatsapp" /></div>
              <h2 className="lx-step-title" ref={headingRef} tabIndex={-1}>Almost done — send it on WhatsApp</h2>
              <p className="lx-so-lead">
                We&apos;ve opened WhatsApp with your order. <strong>Press Send there</strong> to complete it, and attach any reference pictures for the design.
              </p>
              <div className="lx-so-actions column">
                <button type="button" className="lx-btn lx-btn-primary" onClick={openChat}>
                  <Icon name="whatsapp" /> Open WhatsApp again
                </button>
                <button type="button" className="lx-btn lx-btn-light" onClick={() => setSent(false)}>
                  <Icon name="chevron-left" /> Review or change my order
                </button>
                <button type="button" className="lx-so-link" onClick={startOver}>Start a new order</button>
              </div>
            </div>
          ) : (
            <form id="special-order-form" onSubmit={onSubmit} noValidate>
              <div className="lx-so-step" key={step}>
                <h2 className="lx-step-title" ref={headingRef} tabIndex={-1}>
                  <span>Step {step + 1} of 3</span>
                  {STEPS[step]}
                </h2>

                {step === 0 && (
                  <>
                    <div className="lx-note-box">
                      <Icon name="info-circle" />
                      <p>
                        <strong>Note:</strong> The final pricing for your custom order will be confirmed after our team
                        carefully reviews your specific requirements and preferences. We&apos;ll get back to you shortly
                        with a detailed quote.
                      </p>
                    </div>

                    <div className="form-group">
                      <label htmlFor="occasion">Occasion for the custom cake</label>
                      <input type="text" id="occasion" name="occasion" placeholder="e.g., Birthday, Anniversary, Wedding" {...aria("occasion")}
                        value={form.occasion} onChange={(e) => set("occasion", e.target.value, "occasion")} />
                      {fieldError("occasion")}
                    </div>

                    <div className="form-group">
                      <label htmlFor="flavour">Flavour of the cake</label>
                      <input type="text" id="flavour" name="flavour" placeholder="e.g., Chocolate, Vanilla, Red Velvet" {...aria("flavour")}
                        value={form.flavour} onChange={(e) => set("flavour", e.target.value, "flavour")} />
                      {fieldError("flavour")}
                    </div>

                    <div className="form-group">
                      <label htmlFor="weight">Weight of custom cake (minimum 2.5 kg)</label>
                      <div className="weight-input-wrapper">
                        <button type="button" className="weight-btn" id="decrease-weight" aria-label="Decrease weight by 0.5 kg"
                          onClick={() => weight > MIN_WEIGHT && setWeight(Number((weight - STEP).toFixed(1)))}>
                          −
                        </button>
                        <input type="number" id="weight" name="weight" value={weight.toFixed(1)} min="2.5" step="0.5" readOnly />
                        <button type="button" className="weight-btn" id="increase-weight" aria-label="Increase weight by 0.5 kg"
                          onClick={() => setWeight(Number((weight + STEP).toFixed(1)))}>
                          +
                        </button>
                      </div>
                      <div className="weight-display">
                        <Icon name="balance-scale" />
                        <span>Use +/− buttons to adjust weight</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="special-design">Any special design requirements</label>
                      <textarea id="special-design" name="special-design" rows={3}
                        placeholder="Describe your design (e.g., cartoon characters, photo cake, specific theme, colours, decorations)"
                        value={form.specialDesign} onChange={(e) => set("specialDesign", e.target.value)}></textarea>
                      <small className="lx-hint">
                        <Icon name="camera" /> If you have reference images, please send them via WhatsApp after submitting this form
                      </small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="name-on-cake">Name on the cake</label>
                      <select id="name-on-cake" name="name-on-cake" value={form.nameOnCake}
                        onChange={(e) => onNameOnCakeChange(e.target.value as "no" | "yes")}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                      {form.nameOnCake === "yes" && (
                        <input type="text" id="cake-name" name="cake-name" placeholder="Type the name to be written on cake"
                          ref={cakeNameRef} {...aria("cake-name")}
                          value={form.cakeName} onChange={(e) => set("cakeName", e.target.value, "cake-name")} />
                      )}
                      {fieldError("cake-name")}
                    </div>

                    <div className="form-group">
                      <label htmlFor="special-request">Any other request <span className="opt">(optional)</span></label>
                      <textarea id="special-request" name="special-request" placeholder="Tell us any special requirements or preferences..."
                        value={form.specialRequest} onChange={(e) => set("specialRequest", e.target.value)}></textarea>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div className="form-group">
                      <label htmlFor="delivery-date">Date for order delivery (at least {site.leadTimeHours} hours from now)</label>
                      <input type="date" id="delivery-date" name="delivery-date" min={minDate} {...aria("delivery-date")}
                        value={form.deliveryDate} onChange={(e) => set("deliveryDate", e.target.value, "delivery-date")} />
                      {fieldError("delivery-date")}
                    </div>

                    <div className="form-group">
                      <label htmlFor="delivery-mode">Mode of delivery</label>
                      <select id="delivery-mode" name="delivery-mode" value={form.deliveryMode} {...aria("delivery-mode")}
                        onChange={(e) => set("deliveryMode", e.target.value, "delivery-mode")}>
                        <option value="">Select delivery mode</option>
                        <option value="pickup">Pickup</option>
                        <option value="to-go">Home Delivery</option>
                      </select>
                      {fieldError("delivery-mode")}
                    </div>

                    <div className="form-group">
                      <label htmlFor="address">Delivery address</label>
                      <textarea id="address" name="address" placeholder="Enter your complete delivery address" {...aria("address")}
                        value={form.address} onChange={(e) => set("address", e.target.value, "address")}></textarea>
                      {fieldError("address")}
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="form-group">
                      <label htmlFor="name">Name</label>
                      <input type="text" id="name" name="name" placeholder="Enter your full name" autoComplete="name" {...aria("name")}
                        value={form.name} onChange={(e) => set("name", e.target.value, "name")} />
                      {fieldError("name")}
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone number</label>
                      <input type="tel" id="phone" name="phone" placeholder="Enter your 10-digit mobile number" autoComplete="tel-national" inputMode="numeric" maxLength={10} {...aria("phone")}
                        value={form.phone} onChange={(e) => set("phone", digitsOnly(e.target.value), "phone")} />
                      {fieldError("phone")}
                    </div>

                    <div className="lx-review" aria-label="Order summary">
                      <h3>Your order at a glance</h3>
                      <dl>
                        <div><dt>Occasion</dt><dd>{form.occasion.trim()}</dd></div>
                        <div><dt>Flavour</dt><dd>{form.flavour.trim()}</dd></div>
                        <div><dt>Weight</dt><dd>{weight.toFixed(1)} kg</dd></div>
                        {form.nameOnCake === "yes" && <div><dt>Name on cake</dt><dd>{form.cakeName.trim()}</dd></div>}
                        <div><dt>Date</dt><dd>{form.deliveryDate}</dd></div>
                        <div><dt>Mode</dt><dd>{modeText}</dd></div>
                        <div><dt>Address</dt><dd>{form.address.trim()}</dd></div>
                      </dl>
                    </div>
                  </>
                )}
              </div>

              <div className={step === 0 ? "lx-so-actions" : "lx-so-actions split"}>
                {step > 0 && (
                  <button type="button" className="lx-btn lx-btn-light" onClick={() => goTo(step - 1)}>
                    <Icon name="chevron-left" /> Back
                  </button>
                )}
                {step < 2 ? (
                  <button type="submit" className="lx-btn lx-btn-primary">
                    Next <Icon name="arrow-right" />
                  </button>
                ) : (
                  <button type="submit" className="lx-btn lx-btn-primary">
                    <Icon name="whatsapp" /> Send Order on WhatsApp
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        <BorderDivider />
      </main>
      <Footer />
    </div>
  );
}
