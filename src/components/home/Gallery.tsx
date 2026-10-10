"use client";

import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { gallery } from "@/lib/gallery";
import { site } from "@/lib/site";

/** Photo grid with a simple lightbox. Until photos are added in src/lib/gallery.ts it shows an Instagram call-to-action. */
export default function Gallery() {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % gallery.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + gallery.length) % gallery.length));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      {gallery.length > 0 && (
        <div className="lx-gallery-grid">
          {gallery.map((g, i) => (
            <button
              type="button"
              key={g.src}
              className="lx-gallery-tile"
              data-reveal=""
              style={{ "--i": i % 6 } as React.CSSProperties}
              onClick={() => setOpen(i)}
              aria-label={`Open photo: ${g.alt}`}
            >
              <img src={g.src} alt={g.alt} loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}

      <div className="lx-insta" data-reveal="">
        <span className="lx-insta-icon"><Icon name="instagram" /></span>
        <div>
          <h3>See our latest creations</h3>
          <p>Follow {site.instagramHandle} on Instagram for fresh designs, behind-the-scenes and celebration inspiration.</p>
        </div>
        <a className="lx-btn lx-btn-primary" href={site.social.instagram} target="_blank" rel="noopener noreferrer">
          <Icon name="instagram" /> Follow on Instagram
        </a>
      </div>

      {open !== null && gallery[open] && (
        <div className="lx-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={close}>
          <button type="button" className="lx-lightbox-close" aria-label="Close" onClick={close}>
            <Icon name="times" />
          </button>
          <img src={gallery[open].src} alt={gallery[open].alt} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
