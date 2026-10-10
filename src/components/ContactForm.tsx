"use client";

import { useState } from "react";
import { openWhatsApp } from "@/lib/external";
import { site } from "@/lib/site";

/** Sends the enquiry to the business WhatsApp (no mail app or backend needed). */
export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const mail = email.trim();
    openWhatsApp(
      `👋 *New enquiry from the website*\n\n👤 Name: ${name.trim()}\n` +
        (mail ? `📧 Email: ${mail}\n` : "") +
        `\n💬 ${message.trim()}`
    );
    setSent(true);
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <form onSubmit={submit}>
      <label htmlFor="contact-name">Name</label>
      <input type="text" id="contact-name" name="name" placeholder="Your name" autoComplete="name" required
        value={name} onChange={(e) => setName(e.target.value)} />

      <label htmlFor="contact-email">Email <span className="opt">(optional)</span></label>
      <input type="email" id="contact-email" name="email" placeholder="Your email" autoComplete="email"
        value={email} onChange={(e) => setEmail(e.target.value)} />

      <label htmlFor="contact-message">Message</label>
      <textarea id="contact-message" name="message" placeholder="How can we help?" required
        value={message} onChange={(e) => setMessage(e.target.value)}></textarea>

      <button type="submit">Send via WhatsApp</button>
      <p role="status" className="contact-status">
        {sent && `Opening WhatsApp… if nothing opens, message us directly on ${site.phoneDisplay}.`}
      </p>
    </form>
  );
}
