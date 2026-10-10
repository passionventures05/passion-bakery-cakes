"use client";

import { useEffect } from "react";

/**
 * Fades elements marked with data-reveal into view as they scroll on screen.
 * Mounted once in the root layout; also picks up elements that appear later (e.g. product cards).
 * Without JavaScript (or with reduced motion) everything simply shows.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const supported = "IntersectionObserver" in window;
    const seen = new WeakSet<Element>();

    const finish = (el: Element) => {
      el.classList.add("in");
      // once the entrance has played, drop the attribute so hover effects etc. behave normally
      const delay = (parseFloat(getComputedStyle(el).getPropertyValue("--i")) || 0) * 90 + 1200;
      window.setTimeout(() => el.removeAttribute("data-reveal"), delay);
    };

    const io = supported
      ? new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) {
                io!.unobserve(e.target);
                finish(e.target);
              }
            }
          },
          { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
        )
      : null;

    const watch = (el: Element) => {
      if (seen.has(el)) return;
      seen.add(el);
      if (reduce || !io) el.classList.add("in");
      else io.observe(el);
    };

    const scan = (root: ParentNode) => {
      if (root instanceof Element && root.hasAttribute("data-reveal")) watch(root);
      root.querySelectorAll?.("[data-reveal]").forEach(watch);
    };

    scan(document);
    const mo = new MutationObserver((records) => {
      for (const r of records) r.addedNodes.forEach((n) => n.nodeType === 1 && scan(n as Element));
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io?.disconnect();
    };
  }, []);

  return null;
}
