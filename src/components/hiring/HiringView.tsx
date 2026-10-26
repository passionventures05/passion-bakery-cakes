"use client";

import { useRef, useState } from "react";
import BorderDivider from "@/components/BorderDivider";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/useToast";
import { openExternalUrl } from "@/lib/external";
import {
  HIRE_ROLES, MAX_FIELD_LENGTH, applicationSubject, buildApplicationText, findRole, isEmail, mailtoUrl,
  type Application,
} from "@/lib/hiring";
import { site } from "@/lib/site";
import "@/styles/special-order.css";
import "@/styles/luxe-special-order.css";
import "@/styles/hiring.css";

const STEPS = ["Your role", "Role details", "About you"];

interface FormState {
  roleId: string;
  details: Record<string, string>;
  name: string;
  business: string;
  email: string;
  city: string;
  message: string;
}

const initial: FormState = { roleId: "", details: {}, name: "", business: "", email: "", city: "", message: "" };

/** What is wrong on each step, keyed by field id. */
const stepErrors = (step: number, f: FormState): Record<string, string> => {
  const e: Record<string, string> = {};
  const role = findRole(f.roleId);
  if (step === 0 && !role) e["role"] = "Please choose how you would like to work with us.";
  if (step === 1 && role) {
    role.fields.forEach((fd) => {
      if (fd.required && !f.details[fd.id]?.trim()) e[`d-${fd.id}`] = "This question is required.";
    });
  }
  if (step === 2) {
    if (!f.name.trim()) e["h-name"] = "Please enter your name.";
    if (role?.business && !f.business.trim()) e["h-business"] = "Please enter your business name.";
    if (!f.email.trim()) e["h-email"] = "Please enter your email address.";
    else if (!isEmail(f.email.trim())) e["h-email"] = "Enter a valid email address, like name@example.com.";
    if (!f.city.trim()) e["h-city"] = "Please enter your city or area.";
  }
  return e;
};

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export default function HiringView() {
  const [form, setForm] = useState<FormState>(initial);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  // contact (questions) form: name + email + message only
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cMessage, setCMessage] = useState("");
  const [cErrors, setCErrors] = useState<Record<string, string>>({});
  const [cSent, setCSent] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const last = useRef({ subject: "", body: "" });
  const { toast, element: toastEl } = useToast();

  const role = findRole(form.roleId);

  const clearError = (id: string) =>
    setErrors((e) => {
      if (!e[id]) return e;
      const { [id]: _removed, ...rest } = e;
      void _removed;
      return rest;
    });
  const set = <K extends keyof FormState>(key: K, value: FormState[K], errorId?: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errorId) clearError(errorId);
  };
  const setDetail = (id: string, value: string) => {
    setForm((f) => ({ ...f, details: { ...f.details, [id]: value } }));
    clearError(`d-${id}`);
  };

  const aria = (id: string, errs = errors) => ({
    "aria-invalid": errs[id] ? (true as const) : undefined,
    "aria-describedby": errs[id] ? `err-${id}` : undefined,
  });
  const fieldError = (id: string, errs = errors) =>
    errs[id] ? (
      <p className="lx-field-error" id={`err-${id}`} role="alert">
        <Icon name="exclamation-triangle" /> {errs[id]}
      </p>
    ) : null;

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

  const openMail = async () => {
    try {
      await openExternalUrl(mailtoUrl(last.current.subject, last.current.body));
    } catch {
      toast(`We couldn't open your email app. Please write to us at ${site.email}.`);
    }
  };

  const copyApplication = async () => {
    const ok = await copyText(`To: ${site.email}\nSubject: ${last.current.subject}\n\n${last.current.body}`);
    toast(ok ? "Application copied. Paste it into an email to us." : `Couldn't copy. Please write to us at ${site.email}.`);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) return next();

    // re-check every step before sending
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
    const app: Application = { role: role!, details: form.details, name: form.name, business: form.business, email: form.email, city: form.city, message: form.message };
    last.current = { subject: applicationSubject(app), body: buildApplicationText(app) };
    setSent(true);
    window.setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    void openMail();
  };

  const startOver = () => {
    setForm(initial);
    setSent(false);
    setErrors({});
    setStep(0);
  };

  const onContact = (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (!cName.trim()) found["c-name"] = "Please enter your name.";
    if (!cEmail.trim()) found["c-email"] = "Please enter your email address.";
    else if (!isEmail(cEmail.trim())) found["c-email"] = "Enter a valid email address, like name@example.com.";
    if (!cMessage.trim()) found["c-message"] = "Please write your question.";
    setCErrors(found);
    if (Object.keys(found).length) return focusFirst(found);

    const subject = `Hiring question from ${cName.trim()}`;
    const body = `Name: ${cName.trim()}\nEmail: ${cEmail.trim()}\n\n${cMessage.trim()}`;
    setCSent(true);
    setCName("");
    setCEmail("");
    setCMessage("");
    void openExternalUrl(mailtoUrl(subject, body));
  };

  return (
    <div className="site page-special-order page-hiring">
      <Navbar active="hiring" />
      {toastEl}
      <main id="main" tabIndex={-1}>
        <div ref={topRef} className="lx-scroll-anchor" />
        <div className="lx-head on-light" data-reveal="">
          <span className="lx-eyebrow">Join our sweet team</span>
          <h1 className="lx-title">We Are Hiring</h1>
          <p className="lx-sub">
            We&apos;re growing and looking for delivery partners, suppliers and kitchen helpers who care about great
            handmade treats. Tell us about yourself and we&apos;ll reply by email.
          </p>
        </div>

        {!sent && (
          <ol className="lx-progress" aria-label="Application progress">
            {STEPS.map((label, i) => (
              <li key={label} className={i < step ? "done" : i === step ? "current" : ""} aria-current={i === step ? "step" : undefined}>
                <span className="lx-progress-dot">{i < step ? <Icon name="check" /> : i + 1}</span>
                <span className="lx-progress-label">{label}</span>
              </li>
            ))}
          </ol>
        )}

        <div className="container" id="apply">
          {sent ? (
            <div className="lx-so-result" aria-live="polite">
              <div className="lx-so-result-icon"><Icon name="envelope" /></div>
              <h2 className="lx-step-title" ref={headingRef} tabIndex={-1}>Almost done — send the email</h2>
              <p className="lx-so-lead">
                We&apos;ve opened your email app with your application. <strong>Press Send there</strong> to apply.
                Nothing opened? Copy your application and email it to <strong>{site.email}</strong>.
              </p>
              <div className="lx-so-actions column">
                <button type="button" className="lx-btn lx-btn-primary" onClick={openMail}>
                  <Icon name="envelope" /> Open email again
                </button>
                <button type="button" className="lx-btn lx-btn-light" onClick={copyApplication}>
                  <Icon name="copy" /> Copy my application
                </button>
                <button type="button" className="lx-btn lx-btn-light" onClick={() => setSent(false)}>
                  <Icon name="chevron-left" /> Review or change my answers
                </button>
                <button type="button" className="lx-so-link" onClick={startOver}>Start a new application</button>
              </div>
            </div>
          ) : (
            <form id="hiring-form" onSubmit={onSubmit} noValidate>
              <div className="lx-so-step" key={step}>
                <h2 className="lx-step-title" ref={headingRef} tabIndex={-1}>
                  <span>Step {step + 1} of 3</span>
                  {STEPS[step]}
                </h2>

                {step === 0 && (
                  <>
                    <div className="form-group">
                      <label htmlFor="role">How would you like to work with us?</label>
                      <select id="role" name="role" value={form.roleId} {...aria("role")}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, roleId: e.target.value, details: {} }));
                          clearError("role");
                        }}>
                        <option value="">Select a role…</option>
                        {HIRE_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                      </select>
                      {fieldError("role")}
                    </div>
                    {role && (
                      <div className="lx-note-box">
                        <Icon name="info-circle" />
                        <p><strong>{role.label}:</strong> {role.blurb}</p>
                      </div>
                    )}
                  </>
                )}

                {step === 1 && role && (
                  <>
                    {role.fields.map((fd) => {
                      const id = `d-${fd.id}`;
                      const value = form.details[fd.id] ?? "";
                      return (
                        <div className="form-group" key={`${role.id}-${fd.id}`}>
                          <label htmlFor={id}>{fd.label}{!fd.required && <span className="opt"> (optional)</span>}</label>
                          {fd.kind === "select" ? (
                            <select id={id} name={fd.id} value={value} {...aria(id)} onChange={(e) => setDetail(fd.id, e.target.value)}>
                              <option value="">Select…</option>
                              {fd.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          ) : fd.kind === "textarea" ? (
                            <textarea id={id} name={fd.id} rows={3} placeholder={fd.placeholder} maxLength={MAX_FIELD_LENGTH} {...aria(id)}
                              value={value} onChange={(e) => setDetail(fd.id, e.target.value)}></textarea>
                          ) : (
                            <input type="text" id={id} name={fd.id} placeholder={fd.placeholder} maxLength={MAX_FIELD_LENGTH} {...aria(id)}
                              value={value} onChange={(e) => setDetail(fd.id, e.target.value)} />
                          )}
                          {fd.hint && <small className="lx-hint">{fd.hint}</small>}
                          {fieldError(id)}
                        </div>
                      );
                    })}
                  </>
                )}

                {step === 2 && role && (
                  <>
                    <div className="form-group">
                      <label htmlFor="h-name">Your name</label>
                      <input type="text" id="h-name" name="name" placeholder="Enter your full name" autoComplete="name" {...aria("h-name")}
                        value={form.name} onChange={(e) => set("name", e.target.value, "h-name")} />
                      {fieldError("h-name")}
                    </div>

                    {role.business && (
                      <div className="form-group">
                        <label htmlFor="h-business">Business name</label>
                        <input type="text" id="h-business" name="business" placeholder="Your shop or company name" autoComplete="organization" {...aria("h-business")}
                          value={form.business} onChange={(e) => set("business", e.target.value, "h-business")} />
                        {fieldError("h-business")}
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="h-email">Email address</label>
                      <input type="email" id="h-email" name="email" placeholder="We'll reply to this email" autoComplete="email" inputMode="email" {...aria("h-email")}
                        value={form.email} onChange={(e) => set("email", e.target.value, "h-email")} />
                      {fieldError("h-email")}
                    </div>

                    <div className="form-group">
                      <label htmlFor="h-city">City / area</label>
                      <input type="text" id="h-city" name="city" placeholder="e.g. Andheri West, Mumbai" autoComplete="address-level2" {...aria("h-city")}
                        value={form.city} onChange={(e) => set("city", e.target.value, "h-city")} />
                      {fieldError("h-city")}
                    </div>

                    <div className="form-group">
                      <label htmlFor="h-message">Anything else we should know <span className="opt">(optional)</span></label>
                      <textarea id="h-message" name="message" rows={4} maxLength={MAX_FIELD_LENGTH} placeholder="A short note about you or your business"
                        value={form.message} onChange={(e) => set("message", e.target.value)}></textarea>
                    </div>

                    <div className="lx-review" aria-label="Application summary">
                      <h3>Your application at a glance</h3>
                      <dl>
                        <div><dt>Role</dt><dd>{role.label}</dd></div>
                        {role.fields.map((fd) => form.details[fd.id]?.trim() ? (
                          <div key={fd.id}><dt>{fd.label}</dt><dd>{form.details[fd.id].trim()}</dd></div>
                        ) : null)}
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
                    <Icon name="paper-plane" /> Send application by email
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        <BorderDivider />

        <section className="container hiring-contact" id="contact" aria-labelledby="hiring-contact-title">
          <h2 className="lx-step-title" id="hiring-contact-title">
            <span>Have a question first?</span>
            Contact us by email
          </h2>
          <p className="hiring-contact-lead">
            Write to <a href={`mailto:${site.email}`}>{site.email}</a> or use the form below. We read every message.
          </p>

          {cSent ? (
            <div className="lx-note-box" role="status">
              <Icon name="check-circle" />
              <p><strong>Your email is ready.</strong> Press Send in your email app to reach us at {site.email}.</p>
            </div>
          ) : null}

          <form onSubmit={onContact} noValidate>
            <div className="form-group">
              <label htmlFor="c-name">Name</label>
              <input type="text" id="c-name" name="name" placeholder="Your name" autoComplete="name" {...aria("c-name", cErrors)}
                value={cName} onChange={(e) => { setCName(e.target.value); setCSent(false); }} />
              {fieldError("c-name", cErrors)}
            </div>
            <div className="form-group">
              <label htmlFor="c-email">Email</label>
              <input type="email" id="c-email" name="email" placeholder="Your email" autoComplete="email" inputMode="email" {...aria("c-email", cErrors)}
                value={cEmail} onChange={(e) => { setCEmail(e.target.value); setCSent(false); }} />
              {fieldError("c-email", cErrors)}
            </div>
            <div className="form-group">
              <label htmlFor="c-message">Message</label>
              <textarea id="c-message" name="message" rows={4} maxLength={MAX_FIELD_LENGTH * 2} placeholder="Ask us anything about working with us" {...aria("c-message", cErrors)}
                value={cMessage} onChange={(e) => { setCMessage(e.target.value); setCSent(false); }}></textarea>
              {fieldError("c-message", cErrors)}
            </div>
            <button type="submit" className="lx-btn lx-btn-primary">
              <Icon name="envelope" /> Send email
            </button>
          </form>
        </section>

        <BorderDivider />
      </main>
      <Footer hidePhone />
    </div>
  );
}
