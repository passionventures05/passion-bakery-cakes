"use client";

import { useState } from "react";

export interface SlideData {
  src: string;
  alt: string;
  label: string;
}

export default function Slider({ slides }: { slides: SlideData[] }) {
  const [index, setIndex] = useState(0);
  const multi = slides.length > 1;

  return (
    <>
      <div className="slider-container">
        {multi && (
          <button
            className="slider-button prev"
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
          >
            &lt;
          </button>
        )}
        <div className="slider" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((s) => (
            <div className="slide" key={s.label}>
              <img src={s.src} alt={s.alt} />
              <p style={{ fontWeight: "bolder", fontSize: "x-large", color: "#ffffff" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
        {multi && (
          <button
            className="slider-button next"
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
          >
            &gt;
          </button>
        )}
      </div>
      <div className="slider-dots">
        {multi &&
          slides.map((s, i) => (
            <span
              key={s.label}
              className={i === index ? "dot active" : "dot"}
              onClick={() => setIndex(i)}
            />
          ))}
      </div>
    </>
  );
}
