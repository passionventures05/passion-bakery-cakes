import Link from "next/link";
import Icon from "@/components/Icon";
import { site } from "@/lib/site";
import Parallax from "./Parallax";

const sparkles = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 37 + 8) % 96}%`,
  top: `${(i * 53 + 11) % 88}%`,
  size: 5 + ((i * 7) % 9),
  delay: `${((i * 0.7) % 6).toFixed(1)}s`,
  dur: `${(4 + ((i * 3) % 4)).toFixed(0)}s`,
}));

const trust = [
  { icon: "leaf", text: "100% Pure Vegetarian" },
  { icon: "birthday-cake", text: "Freshly Baked to Order" },
  { icon: "check-circle", text: "Hygienic Home Kitchen" },
  { icon: "palette", text: "Custom Designs" },
] as const;

export default function Hero() {
  return (
    <section id="banner" className="lx-hero">
      <div className="glitter-container" aria-hidden="true">
        {sparkles.map((s, i) => (
          <span
            key={i}
            className="sparkle"
            style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay, animationDuration: s.dur }}
          />
        ))}
      </div>

      <div className="lx-hero-media" data-reveal="zoom">
        <Parallax>
          <picture>
            <source media="(max-width: 700px)" srcSet="/Cake_web_banner-960.webp" />
            <img
              src="/Cake_web_banner.webp"
              width={1920}
              height={960}
              alt="Delicious cake for everyone"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </Parallax>
      </div>

      <div className="lx-hero-copy">
        <span className="lx-eyebrow on-light-eyebrow lx-hero-in" style={{ "--d": "0.05s" } as React.CSSProperties}>
          Handcrafted in {site.city}
        </span>
        <h1 className="lx-hero-in" style={{ "--d": "0.15s" } as React.CSSProperties}>
          Welcome to {site.name}
        </h1>
        <p className="lx-hero-tag lx-hero-in" style={{ "--d": "0.28s" } as React.CSSProperties}>
          Your one-stop shop for amazing desserts and sweetness.
        </p>

        <div className="lx-hero-cta lx-hero-in" style={{ "--d": "0.4s" } as React.CSSProperties}>
          <Link href="/products/" className="lx-btn lx-btn-primary">
            <Icon name="birthday-cake" /> Order a Cake
          </Link>
          <Link href="/special-order/" className="lx-btn lx-btn-light">
            <Icon name="palette" /> Design Your Own
          </Link>
        </div>

        <ul className="lx-trust lx-hero-in" style={{ "--d": "0.52s" } as React.CSSProperties}>
          {trust.map((t) => (
            <li key={t.text}>
              <Icon name={t.icon} /> {t.text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
