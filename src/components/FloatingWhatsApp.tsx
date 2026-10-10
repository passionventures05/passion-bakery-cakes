"use client";

import { openWhatsApp } from "@/lib/external";
import { whatsappChatUrl } from "@/lib/site";
import Icon from "./Icon";

/** Always-visible "chat with us" button. Uses the same WhatsApp helper as the order forms (works in the Android app too). */
export default function FloatingWhatsApp() {
  return (
    <a
      className="lx-wa"
      href={whatsappChatUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      onClick={(e) => {
        e.preventDefault();
        openWhatsApp("Hi! I'd like to know more about your cakes 🎂");
      }}
    >
      <Icon name="whatsapp" />
      <span className="lx-wa-label">Chat with us</span>
    </a>
  );
}
