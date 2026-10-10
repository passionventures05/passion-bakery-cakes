"use client";

import { useEffect, useRef } from "react";

/** Gently drifts its child image as the page scrolls (max ±16px). Disabled for reduced motion. */
export default function Parallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const centre = r.top + r.height / 2 - window.innerHeight / 2;
      const y = Math.max(-16, Math.min(16, centre * -0.05));
      el.style.setProperty("--py", `${y.toFixed(1)}px`);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="lx-parallax" ref={ref}>
      {children}
    </div>
  );
}
