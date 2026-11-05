/**
 * A very slow, hands-free scroll from the top of the page to the bottom.
 * It starts once the poppers, fireworks and balloons are over, so the visitor is gently shown the whole website.
 *
 * It stops straight away when the visitor takes over (mouse wheel, finger on the screen, any key press,
 * a click or a drag on the scrollbar), and when it reaches the bottom. It is skipped for visitors who prefer
 * less motion, and if the page has already been scrolled.
 */

/** How fast it scrolls, in pixels per second. Smaller = slower. (30 is a crawl, 60 is a relaxed drift.) */
const SPEED = 140;
/** It eases in over this long, so it does not start with a jerk. */
const EASE_IN_MS = 2500;
/** A short pause after the balloons have gone before it starts moving. */
const START_DELAY_MS = 900;

const TAKEOVER_EVENTS = ["wheel", "touchstart", "pointerdown", "keydown"] as const;

/** Distance scrolled after `ms` milliseconds: speeds up smoothly, then holds a steady pace. */
function distance(ms: number): number {
  const s = ms / 1000;
  const e = EASE_IN_MS / 1000;
  return s < e ? (SPEED * s * s) / (2 * e) : SPEED * (s - e / 2);
}

/** Starts the slow scroll. Returns a function that stops it. */
export function startAutoScroll(): () => void {
  if (typeof window === "undefined") return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const root = document.documentElement;
  let stopped = false;
  let raf = 0;
  let delay = 0;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    window.clearTimeout(delay);
    cancelAnimationFrame(raf);
    TAKEOVER_EVENTS.forEach((e) => window.removeEventListener(e, stop));
    root.style.removeProperty("scroll-behavior");
  };

  TAKEOVER_EVENTS.forEach((e) => window.addEventListener(e, stop, { passive: true }));

  delay = window.setTimeout(() => {
    if (stopped) return;
    if (window.scrollY > 40) {
      stop(); // the visitor has already started scrolling on their own
      return;
    }
    // the site uses "smooth" scrolling, which would fight a frame-by-frame scroll, so switch it off while this runs
    root.style.setProperty("scroll-behavior", "auto", "important");

    const startY = window.scrollY;
    let elapsed = 0;
    let last = 0;

    const frame = (now: number) => {
      if (stopped) return;
      // measured by accumulated time (and capped), so switching tabs and coming back doesn't make it jump
      elapsed += last ? Math.min(now - last, 100) : 0;
      last = now;

      const max = root.scrollHeight - window.innerHeight; // re-read each frame: images and sections can change the height
      const y = Math.min(max, startY + distance(elapsed));
      window.scrollTo(0, y);

      if (y >= max - 1) {
        stop(); // reached the bottom
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }, START_DELAY_MS);

  return stop;
}
