"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { openWhatsApp } from "@/lib/external";
import { digitsOnly } from "@/lib/validation";
import { site } from "@/lib/site";

type Result = null | { kind: "ok" | "no" | "ask" | "bad"; pin: string };

/**
 * "Do you deliver to me?" checker. If site.deliveryPincodes is empty it simply hands the question to WhatsApp,
 * so it never claims anything the bakery has not confirmed.
 */
export default function PincodeCheck() {
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<Result>(null);

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) return setResult({ kind: "bad", pin });
    if (site.deliveryPincodes.length === 0) return setResult({ kind: "ask", pin });
    setResult({ kind: site.deliveryPincodes.includes(pin) ? "ok" : "no", pin });
  };

  const ask = () => openWhatsApp(`Hi! Do you deliver cakes to pincode ${result?.pin ?? pin}? 🎂`);

  return (
    <form className="lx-pin" onSubmit={check} noValidate>
      <label htmlFor="pincode"><Icon name="truck" /> Do we deliver to you?</label>
      <div className="lx-pin-row">
        <input
          id="pincode"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          placeholder="Enter 6-digit pincode"
          value={pin}
          aria-invalid={result?.kind === "bad" ? true : undefined}
          aria-describedby="pincode-result"
          onChange={(e) => {
            setPin(digitsOnly(e.target.value));
            setResult(null);
          }}
        />
        <button type="submit" className="lx-btn lx-btn-primary lx-btn-sm">Check</button>
      </div>
      <p id="pincode-result" className="lx-pin-result" role="status" aria-live="polite">
        {result?.kind === "bad" && "Please enter a valid 6-digit pincode."}
        {result?.kind === "ok" && (
          <>
            <Icon name="check-circle" /> Great news — we deliver to {result.pin}. Delivery charges, if any, are confirmed before you pay.
          </>
        )}
        {result?.kind === "no" && (
          <>
            {result.pin} isn&apos;t on our delivery list yet, but pick-up is always available.{" "}
            <button type="button" className="lx-link" onClick={ask}>Ask us on WhatsApp</button>
          </>
        )}
        {result?.kind === "ask" && (
          <>
            We serve {site.city} and nearby areas.{" "}
            <button type="button" className="lx-link" onClick={ask}>Confirm {result.pin} on WhatsApp</button>
          </>
        )}
      </p>
    </form>
  );
}
